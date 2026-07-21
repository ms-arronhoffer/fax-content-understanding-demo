# Building this demo manually in the Azure Portal

This is a click-by-click alternative to `az deployment group create -f infra/main.bicep` for
anyone who wants to see (or demo) every resource being created live in the Azure Portal and
the **Azure AI Foundry** portal, instead of running Bicep.

> Resource names below match the ones the Bicep template generates (`aif-faxcu-<suffix>`,
> `stfaxcu<suffix>`, `logic-faxcu-<suffix>`) — feel free to use your own names, just keep them
> consistent across steps.

## 0. Prerequisites

- An Azure subscription with quota for a Foundry (`Microsoft.CognitiveServices/accounts`, kind `AIServices`) resource and GPT-4.1-mini / text-embedding-3-large **GlobalStandard** model deployments.
- Pick a region where the Content Understanding **GA API (`2025-11-01`)** is supported:
  `australiaeast`, `eastus`, `eastus2`, `japaneast`, `northeurope`, `southcentralus`,
  `southeastasia`, `swedencentral`, `uksouth`, `westeurope`, `westus`, `westus3`.
  This demo uses **East US 2**. `centralus` is *not* supported by the GA API.

## 1. Create the resource group

1. Portal search bar → **Resource groups** → **+ Create**.
2. Subscription: your subscription. Resource group name: `rg-fax-cu-demo`. Region: **East US 2**.
3. **Review + create** → **Create**.

## 2. Create the Storage account + containers

1. In `rg-fax-cu-demo` → **+ Create** → **Storage account**.
2. Name: `stfaxcu<yoursuffix>` (must be globally unique, lowercase, no dashes). Region: **East US 2**. Performance: Standard. Redundancy: LRS.
3. **Advanced** tab → confirm **Require secure transfer** is on and **Minimum TLS version** is `1.2`.
4. **Review + create** → **Create**.
5. Once deployed, open the storage account → **Containers** → **+ Container** and create three, all with **Private (no anonymous access)**:
   - `incoming`
   - `processed`
   - `errors`

## 3. Create the Azure AI Foundry (Content Understanding) resource

1. In `rg-fax-cu-demo` → **+ Create** → search **Azure AI Foundry** (this creates a `Microsoft.CognitiveServices/accounts` resource of kind `AIServices`, the multi-service resource Content Understanding runs on).
2. Name: `aif-faxcu-<yoursuffix>`. Region: **East US 2**. Pricing tier: **S0**.
3. **Identity** tab (or after creation, under **Identity**) → turn **System assigned managed identity** to **On**. This is what the Logic App's HTTP calls will eventually be authorized against — but the Logic App needs its *own* identity too (step 8), so make sure this Foundry resource's identity is On for consistency, though only the Logic App's identity is actually granted access in step 8.
4. **Networking** tab → confirm **Custom domain name** matches the resource name (`aif-faxcu-<yoursuffix>`) — required for Content Understanding's REST endpoints.
5. **Review + create** → **Create**.
6. After deployment, note the endpoint shown on the resource's **Overview** page (or **Keys and Endpoint**): `https://aif-faxcu-<yoursuffix>.cognitiveservices.azure.com`.

## 4. Deploy the GPT and embedding models

1. On the Foundry resource, open **Go to Azure AI Foundry portal** (ai.azure.com) for this resource, or use the **Model deployments** blade directly in the Azure Portal.
2. **+ Deploy model** → search **gpt-4.1-mini** → Deployment type: **Global Standard** → Deployment name: `gpt-4.1-mini` → Capacity: `10` (10K TPM) → **Deploy**.
3. **+ Deploy model** again → search **text-embedding-3-large** → Deployment type: **Global Standard** → Deployment name: `text-embedding-3-large` → Capacity: `10` → **Deploy**.
4. Wait for both deployments to show **Succeeded**.

## 5. Point Content Understanding at those deployments (defaults)

The Content Understanding GA API needs to know which deployment names back the
`prebuilt-analyzer-completion`, `prebuilt-analyzer-completion-mini`, and
`prebuilt-analyzer-embedding` aliases used by custom analyzers. As of this API version there
isn't a dedicated Portal UI toggle for this mapping, so set it with one REST call (Cloud
Shell or local `az`/PowerShell works fine — no code editor needed):

```powershell
$token = az account get-access-token --resource "https://cognitiveservices.azure.com" --query accessToken -o tsv
$body = @{
    modelDeployments = @{
        "prebuilt-analyzer-completion"      = "gpt-4.1-mini"
        "prebuilt-analyzer-completion-mini" = "gpt-4.1-mini"
        "prebuilt-analyzer-embedding"        = "text-embedding-3-large"
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Patch `
  -Uri "https://aif-faxcu-<yoursuffix>.cognitiveservices.azure.com/contentunderstanding/defaults?api-version=2025-11-01" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

(This is exactly what [content-understanding/setup-analyzer.ps1](../content-understanding/setup-analyzer.ps1) automates — you can run that script instead of the raw call above once the resource exists.)

## 6. Create the custom analyzer (fax_document_analyzer)

1. Open the **Azure AI Foundry portal** (ai.azure.com) → select the `aif-faxcu-<yoursuffix>` resource/project → **Content Understanding** in the left nav → **+ Create analyzer**.
2. Base analyzer: **prebuilt-document**. Analyzer ID: `fax_document_analyzer` (must match [content-understanding/analyzer-schema.json](../content-understanding/analyzer-schema.json) — the GA API only allows letters, digits, `.` and `_` in the ID, no hyphens).
3. Under **Models**, map `completion` → `prebuilt-analyzer-completion` and `embedding` → `prebuilt-analyzer-embedding` (these should already default correctly after step 5).
4. Add each field from the table below via **+ Add field**, matching **type**, **method**, and **description**. For `DocumentType`, set method to **Classify** and add the enum values listed.

   | Field | Type | Method | Notes |
   |---|---|---|---|
   | `SenderName` | string | extract | Name of the person who sent the fax |
   | `SenderOrganization` | string | extract | Company/clinic/org of the sender |
   | `SenderFaxNumber` | string | extract | Sender's fax number from the transmission banner |
   | `SenderPhoneNumber` | string | extract | Sender's callback phone number |
   | `RecipientName` | string | extract | Intended recipient of the fax |
   | `RecipientFaxNumber` | string | extract | Recipient's fax number |
   | `DateSent` | date | extract | Date the fax was sent |
   | `PageCount` | integer | extract | Total pages in the transmission |
   | `DocumentType` | string | classify | enum: `Referral`, `Invoice`, `PurchaseOrder`, `LabResult`, `InsuranceForm`, `General`, `Other` |
   | `Subject` | string | extract | Subject line or stated reason for the fax |
   | `Summary` | string | generate | 2-3 sentence plain-language summary |
   | `ActionRequired` | boolean | generate | Whether the doc requests an action/reply/signature |
   | `ActionDescription` | string | generate | Description of the requested action, if any |

5. Under **Config**, enable **Return details** and **Estimate field source and confidence**.
6. **Save** / **Build** the analyzer and wait for its status to become **Ready**.
7. Use the portal's **Try it out** pane to upload [samples/sampleFax.pdf](../samples/sampleFax.pdf) (or your own file) and confirm fields come back populated with confidence scores — or run [content-understanding/sample-analyze.ps1](../content-understanding/sample-analyze.ps1) from your machine against the same endpoint.

> **Generic (non-fixed-schema) key-value pairs instead:** skip steps 6.2–6.5 and just call the
> built-in **`prebuilt-documentFields`** analyzer (already present on every Foundry resource,
> no creation needed) — it dynamically discovers whatever key-value pairs exist in a document,
> similar to Document Intelligence's General Document model. Test it with:
> `./sample-analyze.ps1 -Endpoint "https://aif-faxcu-<yoursuffix>.cognitiveservices.azure.com" -FilePath ../samples/sampleFax.pdf -AnalyzerId "prebuilt-documentFields"`

## 7. Create the Logic App (Consumption)

1. In `rg-fax-cu-demo` → **+ Create** → **Logic App**. Plan type: **Consumption**. Name: `logic-faxcu-<yoursuffix>`. Region: **East US 2**.
2. **Review + create** → **Create**.
3. Open the new Logic App → **Identity** → **System assigned** → toggle **On** → **Save**. Copy the **Object (principal) ID**.
4. Go back to the `aif-faxcu-<yoursuffix>` Foundry resource → **Access control (IAM)** → **+ Add role assignment** → role **Cognitive Services User** → **Members** → assign to the Logic App's managed identity (search by its name, `logic-faxcu-<yoursuffix>`) → **Review + assign**. This lets the workflow call Content Understanding without an API key.
5. Back on the Logic App → **Logic app designer** (or **Workflow → Designer**) and build:
   - **Trigger**: *When a blob is added or modified (properties only)* (Azure Blob connector) → Storage account `stfaxcu<yoursuffix>` → container `incoming`.
   - **Action 1**: *Get blob content* (or *Read blob*) for the triggering blob; get a **temporary SAS URL** action so Content Understanding can fetch it.
   - **Action 2**: **HTTP** action — `POST https://aif-faxcu-<yoursuffix>.cognitiveservices.azure.com/contentunderstanding/analyzers/fax_document_analyzer:analyze?api-version=2025-11-01`, Authentication: **Managed Identity**, Audience `https://cognitiveservices.azure.com`, Body: `{ "url": "<sas url from Action 1>" }`.
   - **Action 3**: *Initialize variable* `operationLocation` = the `Operation-Location` response header from Action 2.
   - **Action 4**: *Until* loop — repeat an **HTTP GET** to `operationLocation` (same Managed Identity auth) until the JSON body's `status` is `Succeeded` or `Failed` (add a short **Delay** inside the loop, e.g. 5 seconds).
   - **Action 5**: *Condition* — if `status` equals `Succeeded`, **Create blob** in the `processed` container with the poll result JSON as content; else **Create blob** in the `errors` container.
   - For the exact expressions/shape, use [logic-app/workflow.json](../logic-app/workflow.json) as a reference — you can also open that file's raw JSON in the designer's **Code view** and paste it in directly instead of rebuilding each action by hand.
6. **Save** the workflow.

## 8. Build the upload flow and test end to end

1. Follow [power-automate/README.md](../power-automate/README.md) to build the "local folder → Blob" cloud flow that uploads a file to the `incoming` container.
2. Run the Power Automate flow with a sample file (or drag a file straight into the `incoming` container in the Portal's **Storage browser**).
3. Watch the Logic App's **Run history** for a successful run, then confirm a `.json` result file appears in the `processed` container.

That's the full stack, built entirely through the Portal + Azure AI Foundry portal UI, with only one small REST call needed (step 5) to set the default model mappings.
