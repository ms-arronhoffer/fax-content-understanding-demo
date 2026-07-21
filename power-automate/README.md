# Power Automate: local folder → Blob Storage `incoming`

Power Automate **cloud flows** can't watch a local filesystem directly (that requires a desktop flow + gateway). For this demo we use the simplest reliable pattern: a **manually-triggered cloud flow** where the presenter/user picks a file from their local machine at run time, and the flow uploads it straight to the `incoming` container.

## Steps

1. Go to [make.powerautomate.com](https://make.powerautomate.com) → **Create** → **Instant cloud flow**.
2. Name it `Upload Fax to Blob Storage` and choose trigger **Manually trigger a flow** → **Create**.
3. On the trigger card, select **+ Add an input** → **File**. Name it `Document` — this is what lets the flow picker (web, mobile, or desktop) prompt the user to browse their local folder and attach a file when they run the flow.
4. Add a new step → search for **Azure Blob Storage** → action **Create blob (V2)**.
5. Sign in with your Azure Blob Storage connection (storage account name + access key, or Azure AD, from the deployed storage account — see the `storageAccountName` output from [../infra/main.bicep](../infra/main.bicep)).
6. Configure the action:
   - **Storage account name / connection**: the deployed storage account
   - **Folder path**: `incoming`
   - **Blob name**: dynamic content → `Document file name` (from the trigger's File input)
   - **Blob content**: dynamic content → `Document file content`
7. Save the flow.

## Running the demo

1. Open the flow and select **Run** (or **Run flow** from the mobile app for a more "local folder" feel).
2. When prompted, browse to a local folder and pick a sample document (see [../samples/README.md](../samples/README.md)).
3. The file uploads to `incoming/<filename>` in Blob Storage, which triggers the Logic App within about a minute (see root [README.md](../README.md) for the full flow).

## Alternative: automatic trigger for a "watched folder" feel

If you want the demo to look more like an automatically-watched folder (no manual "Run" click), point the flow at a **OneDrive for Business** folder instead:

- Trigger: **When a file is created (properties only)** (OneDrive for Business connector), watching a specific folder
- Action: same **Create blob (V2)** step as above, reading the file via **Get file content** first

This trades the "pick any local file" flexibility for a folder that auto-syncs from the desktop (via the OneDrive sync client), which behaves like a local folder for demo purposes while still using only cloud-flow connectors.
