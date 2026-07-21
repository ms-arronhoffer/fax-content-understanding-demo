# Sample documents

This demo intentionally does **not** ship a real fax/document sample, to avoid embedding any real customer or patient data in the repo.

## Getting a sample document for the demo

Pick one of these options:

1. **Create a synthetic one.** Draft a one-page "referral fax" or "purchase order fax" in Word/Google Docs with a fake sender/recipient, a transmission banner (`TO:`, `FROM:`, `FAX:`, `PAGES:`, `DATE:`), a subject line, and a short body paragraph. Export/print to PDF and drop it in this folder (it's git-ignored, so it stays local).
2. **Use a public sample.** The [Azure-Samples/azure-ai-content-understanding-python](https://github.com/Azure-Samples/azure-ai-content-understanding-python) repo and the [Azure-Samples/azure-ai-content-understanding-assets](https://github.com/Azure-Samples/azure-ai-content-understanding-assets) repo have public sample documents (invoices, forms) you can substitute for a "fax" in a live demo.
3. **Scan a real, non-sensitive document** on hand (e.g., a blank internal form) through a physical fax machine or "print to PDF" to get realistic banner artifacts.

## Expected output shape

[expected-output.json](expected-output.json) shows a representative Content Understanding response for the custom `fax-document-analyzer` schema defined in [../content-understanding/analyzer-schema.json](../content-understanding/analyzer-schema.json) — useful as a reference for what the Logic App writes to the `processed` container.
