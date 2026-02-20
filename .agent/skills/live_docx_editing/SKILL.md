---
name: live_docx_editing
description: Overview of strategies for implementing live .docx editing in web applications, including pros/cons of HTML conversion vs native rendering.
---

# Live .docx Editing Strategies

This skill documents the trade-offs explored for the DocxAI frontend when providing a "live" editing experience for Word documents.

## 1. Strategy A: HTML Conversion (Current)
Conver the `.docx` to HTML on the backend using `mammoth` or `pypandoc`, edit in a web-based Rich Text Editor (React-Quill / TinyMCE), and convert back to `.docx`.
- **Pros:** Full control over UI, easy implementation of "Suggestions" as custom HTML markers.
- **Cons:** Loss of complex Word formatting (headers/footers/tables) during the double conversion.

## 2. Strategy B: Native Canvas Rendering
Use libraries like `docxjs` to render the XML structure directly to a canvas or SVG.
- **Pros:** Perfect visual fidelity with Microsoft Word.
- **Cons:** extremely difficult to implement interactive "Edit" logic and "Track Changes" UI.

## 3. Best Practices for DocxAI Implementation
- **Suggestion Highlighting:** Use standard HTML decorators (e.g., `<span class="suggestion-add">`) that can be stripped or accepted via the `/api/apply` endpoint.
- **Download Lifecycle:** Always provide a preview of the "final" state before triggering the binary download.
- **Locking:** When an AI is "running" a suggestion, lock the editor to prevent state desync.
