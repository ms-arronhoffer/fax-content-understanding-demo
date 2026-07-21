<#
.SYNOPSIS
    Runs the "fax_document_analyzer" custom analyzer against a local sample document,
    independent of the Logic App — useful for validating the analyzer and previewing
    extracted fields before wiring up the end-to-end pipeline.

.PARAMETER Endpoint
    The Content Understanding / Foundry resource endpoint.

.PARAMETER ApiKey
    Optional. If omitted, an Azure AD token is obtained via `az account get-access-token`.

.PARAMETER FilePath
    Path to a local sample document (PDF/image/TIFF). See ../samples/README.md for how
    to source one.

.PARAMETER AnalyzerId
    Defaults to "fax_document_analyzer" (must match analyzer-schema.json's analyzerId).

.EXAMPLE
    ./sample-analyze.ps1 -Endpoint "https://aif-faxcu123.cognitiveservices.azure.com" -FilePath ./sample-fax.pdf
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Endpoint,

    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [Parameter(Mandatory = $false)]
    [string]$ApiKey,

    [Parameter(Mandatory = $false)]
    [string]$AnalyzerId = "fax_document_analyzer",

    [Parameter(Mandatory = $false)]
    [string]$ApiVersion = "2025-11-01"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $FilePath)) {
    throw "File not found: $FilePath"
}
$Endpoint = $Endpoint.TrimEnd('/')

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

# Content Understanding accepts inline base64 content via the "data" field, which avoids
# needing a publicly reachable URL for a local file (the Logic App instead uses a SAS URL
# from Blob Storage — see ../logic-app/workflow.json).
Write-Host "Reading '$FilePath' and submitting to analyzer '$AnalyzerId'..." -ForegroundColor Cyan
$fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
$base64 = [System.Convert]::ToBase64String($fileBytes)

$analyzeBody = @{
    inputs = @(
        @{ data = $base64 }
    )
} | ConvertTo-Json -Depth 5

$response = Invoke-WebRequest -Method Post `
    -Uri "$Endpoint/contentunderstanding/analyzers/$($AnalyzerId):analyze?api-version=$ApiVersion" `
    -Headers $headers -Body $analyzeBody -SkipHttpErrorCheck

if ($response.StatusCode -ge 400) {
    throw "Analyze request failed ($($response.StatusCode)): $($response.Content)"
}

$operationLocation = $response.Headers["Operation-Location"]
if ($operationLocation -is [System.Array]) {
    $operationLocation = $operationLocation[0]
}
if (-not $operationLocation) {
    throw "Expected an Operation-Location header in the analyze response but none was returned."
}

Write-Host "Analysis submitted. Polling $operationLocation ..." -ForegroundColor Cyan
$status = "Running"
$result = $null
$attempts = 0
while ($status -notin @("Succeeded", "Failed") -and $attempts -lt 60) {
    Start-Sleep -Seconds 3
    $result = Invoke-RestMethod -Method Get -Uri $operationLocation -Headers $headers
    $status = $result.status
    $attempts++
    Write-Host "  status: $status (attempt $attempts)"
}

if ($status -ne "Succeeded") {
    Write-Host "Analysis did not succeed. Full response:" -ForegroundColor Red
    $result | ConvertTo-Json -Depth 20
    exit 1
}

Write-Host "`nAnalysis succeeded. Extracted fields:`n" -ForegroundColor Green
$fields = $result.result.contents[0].fields

function Format-FieldValue($field) {
    if ($null -ne $field.valueString) { return $field.valueString }
    if ($null -ne $field.valueInteger) { return $field.valueInteger }
    if ($null -ne $field.valueBoolean) { return $field.valueBoolean }
    if ($null -ne $field.valueDate) { return $field.valueDate }
    if ($null -ne $field.valueNumber) { return $field.valueNumber }
    if ($null -ne $field.valueObject) {
        $parts = $field.valueObject.PSObject.Properties.Name | ForEach-Object {
            "$_=$(Format-FieldValue $field.valueObject.$_)"
        }
        return "{ $($parts -join '; ') }"
    }
    if ($null -ne $field.valueArray) {
        $parts = $field.valueArray | ForEach-Object { Format-FieldValue $_ }
        return "[$($parts -join ', ')]"
    }
    return $null
}

foreach ($fieldName in $fields.PSObject.Properties.Name) {
    $field = $fields.$fieldName
    $value = Format-FieldValue $field
    $confidence = if ($field.confidence) { "{0:P0}" -f $field.confidence } else { "n/a" }
    Write-Host ("  {0,-25} {1,-45} (confidence: {2})" -f $fieldName, $value, $confidence)
}

$outFile = Join-Path (Split-Path $FilePath -Parent) "$([System.IO.Path]::GetFileNameWithoutExtension($FilePath)).result.json"
$result | ConvertTo-Json -Depth 20 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "`nFull result written to $outFile" -ForegroundColor Yellow
