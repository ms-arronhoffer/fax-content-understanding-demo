# Logic App workflow

[workflow.json](workflow.json) is the Consumption Logic App's Workflow Definition Language document, deployed by [../infra/main.bicep](../infra/main.bicep) via `loadJsonContent(...)`.

## Flow summary

1. **Trigger**: `When_a_blob_is_added_or_modified` — polls the `incoming` container every minute (Consumption Logic Apps' built-in Azure Blob Storage connector trigger).
2. **Get_blob_content** / **Create_SAS_URI_by_path** — reads the new file and generates a short-lived (30 min) read-only SAS URL for it.
3. **Analyze_Document_with_Content_Understanding** — `POST .../analyzers/{analyzerId}:analyze`, authenticated with the Logic App's **system-assigned managed identity** (no keys/secrets stored in the workflow).
4. **Until_analysis_completes** — polls the `Operation-Location` returned by step 3 every 3 seconds (up to 5 minutes) until `status` is `Succeeded` or `Failed`.
5. **Check_if_analysis_succeeded** — writes the full JSON result to `processed/<filename>.json` on success, or to `errors/<filename>.error.json` on failure.

## After deploying

Hand-authored Logic App JSON occasionally needs the designer to normalize connector action shapes (e.g. dynamic swagger metadata for the Azure Blob Storage connector). After the Bicep deployment:

1. Open the Logic App in the Azure portal → **Logic app designer**.
2. Confirm each step loads without a "parameters not populated" warning; if the designer complains about a step, click into it, reselect the container/folder in the relevant dropdowns, and **Save**.
3. Trigger a test run by uploading a file to the `incoming` container.

## Future enhancement: Event Grid trigger

This demo intentionally uses the **polling blob trigger** (checks every minute) for simplicity. For a production scenario, replace the trigger with an **Event Grid** subscription on the storage account's `Microsoft.Storage.BlobCreated` event, which fires the Logic App within seconds instead of up to a minute later. This is documented here as a follow-up enhancement and is **not implemented** in this demo.
