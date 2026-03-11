# 📂 Proof of Concept: Google Drive Vault

This mockup demonstrates how the **Google Drive Vault** would be integrated into the existing **Client Management** page.

![Google Drive Vault Mockup](file:///C:\Users\Dell\.gemini\antigravity\brain\394cce7c-b218-4893-9e45-f1af8e6ff2ab\google_drive_vault_mockup_1773240299073.png)

## 🏗️ Design Highlights
1. **Seamless Integration**: A new "Document Vault" tab appears inside each client's profile.
2. **Folder Mapping**: The app automatically maps folders from your firm's Drive (e.g., `KCS_TaskPro > Clients > [ClientName] > GST`).
3. **Cloud Action Bar**:
    *   **Sync with Drive**: Refreshes the folder list from Google Cloud.
    *   **Upload to Drive**: Uploads a document directly to the specific client folder without touching your local database storage.
4. **Google Identity**: Uses the familiar Google Drive folder icons to give staff confidence that data is securely stored in your firm's cloud.

## ⚙️ Technical Workflow (Logic Only)
- **Step 1**: The admin connects the Firm's Google Workspace account via OAuth.
- **Step 2**: When a new client is created in KCS TaskPro, the system calls the Google Drive API to create a root "Vault" folder for that client.
- **Step 3**: The `/clients/[id]` page fetches the structure using a server-side API proxy.
- **Step 4**: Files are streamed directly to/from Google Drive using Signed URLs, keeping your server fast and lightweight.

---
**Does this layout match the workflow you had in mind for your staff?**
