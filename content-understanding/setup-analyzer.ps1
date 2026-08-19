<#
.SYNOPSIS
    Configures default model deployments and creates the custom "fax_document_analyzer"
    on an Azure Content Understanding (Microsoft Foundry / AIServices) resource.

.DESCRIPTION
    Run this once against the Foundry resource deployed by ../infra/main.bicep, before
    the Logic App or sample-analyze.ps1 are used. It:
      1. Sets the resource's default GPT + embedding model deployments (required by
         Content Understanding for generate/classify field methods).
      2. Creates (or updates) the custom analyzer from analyzer-schema.json.
      3. Polls until the analyzer is ready to use.

.PARAMETER Endpoint
    The Content Understanding / Foundry resource endpoint, e.g.
    https://<resource-name>.cognitiveservices.azure.com

.PARAMETER ApiKey
    Optional. A Foundry resource API key. If omitted, an Azure AD access token is
    obtained via `az account get-access-token` for the signed-in `az` session
    (recommended — matches the Managed Identity auth pattern used by the Logic App).

.PARAMETER GptDeploymentName
.PARAMETER EmbeddingDeploymentName
    Names of the model deployments created by infra/main.bicep (defaults match the
    bicep template's defaults).

.EXAMPLE
    ./setup-analyzer.ps1 -Endpoint "https://aif-faxcu123.cognitiveservices.azure.com"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Endpoint,

    [Parameter(Mandatory = $false)]
    [string]$ApiKey,

    [Parameter(Mandatory = $false)]
    [string]$GptDeploymentName = "gpt-5.4-mini",

    [Parameter(Mandatory = $false)]
    [string]$EmbeddingDeploymentName = "text-embedding-3-large",

    [Parameter(Mandatory = $false)]
    [string]$ApiVersion = "2025-11-01"
)

$ErrorActionPreference = "Stop"

$Endpoint = $Endpoint.TrimEnd('/')
$schemaPath = Join-Path $PSScriptRoot "analyzer-schema.json"
if (-not (Test-Path $schemaPath)) {
    throw "Could not find analyzer-schema.json next to this script at: $schemaPath"
}
$analyzerDefinition = Get-Content $schemaPath -Raw | ConvertFrom-Json
$analyzerId = $analyzerDefinition.analyzerId

function Get-AuthHeaders {
    if ($ApiKey) {
        return @{ "Ocp-Apim-Subscription-Key" = $ApiKey }
    }
    Write-Host "No -ApiKey supplied; requesting an Azure AD token via 'az account get-access-token'..." -ForegroundColor Cyan
    $tokenJson = az account get-access-token --resource "https://cognitiveservices.azure.com" | ConvertFrom-Json
    return @{ "Authorization" = "Bearer $($tokenJson.accessToken)" }
}

$headers = Get-AuthHeaders
$headers["Content-Type"] = "application/json"

# 1. Set default model deployments
Write-Host "Setting default model deployments on $Endpoint ..." -ForegroundColor Cyan
$defaultsBody = @{
    modelDeployments = @{
        "prebuilt-analyzer-completion"      = $GptDeploymentName
        "prebuilt-analyzer-completion-mini" = $GptDeploymentName
        "prebuilt-analyzer-embedding"        = $EmbeddingDeploymentName
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Patch `
    -Uri "$Endpoint/contentunderstanding/defaults?api-version=$ApiVersion" `
    -Headers $headers -Body $defaultsBody | Out-Null
Write-Host "Default model deployments configured (gpt=$GptDeploymentName, embedding=$EmbeddingDeploymentName)." -ForegroundColor Green

# 2. Create/update the custom analyzer
Write-Host "Creating/updating analyzer '$analyzerId' ..." -ForegroundColor Cyan
$analyzerBody = $analyzerDefinition | ConvertTo-Json -Depth 20

$response = Invoke-WebRequest -Method Put `
    -Uri "$Endpoint/contentunderstanding/analyzers/$($analyzerId)?api-version=$ApiVersion" `
    -Headers $headers -Body $analyzerBody -SkipHttpErrorCheck

if ($response.StatusCode -ge 400) {
    throw "Analyzer creation failed ($($response.StatusCode)): $($response.Content)"
}

# Analyzer creation can be asynchronous (202 + Operation-Location) or synchronous (200/201).
$operationLocation = $response.Headers["Operation-Location"]
if ($operationLocation -is [System.Array]) {
    $operationLocation = $operationLocation[0]
}
if ($operationLocation) {
    Write-Host "Analyzer creation is processing asynchronously. Polling..." -ForegroundColor Cyan
    $status = "Running"
    $attempts = 0
    while ($status -notin @("Succeeded", "Failed") -and $attempts -lt 30) {
        Start-Sleep -Seconds 2
        $poll = Invoke-RestMethod -Method Get -Uri $operationLocation -Headers $headers
        $status = $poll.status
        $attempts++
        Write-Host "  status: $status (attempt $attempts)"
    }
    if ($status -ne "Succeeded") {
        throw "Analyzer creation did not succeed. Final status: $status"
    }
}

Write-Host "Analyzer '$analyzerId' is ready." -ForegroundColor Green
Write-Host "Next: run .\sample-analyze.ps1 -Endpoint `"$Endpoint`" -FilePath <path-to-sample-document> to test it standalone." -ForegroundColor Yellow
