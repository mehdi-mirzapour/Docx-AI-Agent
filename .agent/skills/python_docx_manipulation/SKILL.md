---
name: python_docx_manipulation
description: Guide to analyzing and manipulating .docx files using python-docx and XML parsing, including safe ID generation.
---

# Python-docx Manipulation Tips

This skill covers the core logic of reading and modifying Word documents for AI-powered suggestions.

## 1. Reading Text Efficiently
Always skip empty paragraphs and handle word counting at the paragraph level for better batching.

```python
paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
word_count = sum(len(p.split()) for p in paragraphs)
```

## 2. Batching for AI Analysis
Don't send the whole document at once. Batch paragraphs (e.g., 5-10 at a time) to GPT-4o to stay within context limits and get higher quality, specific JSON suggestions.

## 3. Applying Changes Safely
**Crucial Pattern:** When applying multiple text replacements, always sort your suggestion list by `paragraph_index` in **reverse order**.
- **Why?** Replacing text can change the length or contents of the `paragraphs` collection. Processing from bottom to top ensures your indices remain valid.

```python
sorted_suggestions = sorted(selected_suggestions, key=lambda x: x["paragraph_index"], reverse=True)
for sug in sorted_suggestions:
    doc.paragraphs[sug["paragraph_index"]].text = sug["suggested"]
```

## 4. Simulating Track Changes
`python-docx` does not support the native "Track Changes" feature easily.
- **Alternative:** Use font colors or background highlights to indicate suggested vs. original text if the user wants to see the diff in the Word file.
- **Implementation:** `paragraph.runs[0].font.color.rgb = RGBColor(0x00, 0x00, 0xFF)`

## 5. Metadata and Cleanup
- Always verify if a file is a valid zip/docx before processing (`zipfile.is_zipfile`).
- Implement an automated cleanup for the `uploads/` folder to prevent disk exhaustion.
