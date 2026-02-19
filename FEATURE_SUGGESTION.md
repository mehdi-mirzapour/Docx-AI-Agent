# 📝 Feature: AI Suggestion Inside Doc

This feature enhances the Docx AI Agent by providing intelligent, tracked suggestions directly within your Microsoft Word documents.

## 🌟 Capabilities

- **Automated Review**: The AI scans your document for potential improvements.
- **Tracked Changes**: Suggestions are inserted as native Word "Track Changes" (Insertions/Deletions), allowing you to easily Review, Accept, or Reject them within Word or via our UI.
- **Smart Suggestions**:
    - **Rephrasing**: Refines text for better flow and professionalism.
    - **Punctuation**: Fixes and improves punctuation.
    - **Formatting**: Suggests changes like uppercase for headers.

## 🛠️ How It Works

1.  **Upload**: You upload a `.docx` file via the web interface.
2.  **Processing**:
    -   The backend (`/suggest-changes/`) parses the document.
    -   It identifies headers and applies specific rules (Rephrase, Punctuate, Uppercase).
    -   Modifications are applied using `python-docx` and low-level XML manipulation to create valid "Tracked Changes" ( `w:ins` and `w:del` tags).
    -   A "safe" version of the file is saved.
3.  **Review UI**:
    -   The frontend lists all detected changes.
    -   You can preview the "Original" vs "New" text.
    -   You can **Accept** or **Reject** changes individually.
    -   The backend updates the actual `.docx` file in real-time based on your actions.
4.  **Download**: Get the final polished document with `_AI_Suggestions` suffix.

## 🔧 Technical Details

- **Backend**: FastAPI + `python-docx` + custom XML OxmlElement handling for revisions.
- **Frontend**: React + Lucide Icons for a clean, interactive dashboard.
- **State Management**: Changes are tracked by unique IDs generated during the processing phase.

## 🚀 Usage

1.  Start the backend (`uvicorn main:app --reload`) and frontend (`npm run dev`).
2.  Navigate to `http://localhost:5173`.
3.  Upload a `.docx` file.
4.  Wait for processing to complete.
5.  Interact with the suggestions panel to refine your document.
6.  Click **Download** to save your work.
