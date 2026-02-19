---
name: python_docx_manipulation
description: Guide to analyzing and manipulating .docx files using python-docx and XML parsing, including safe ID generation.
---

# Manipulating .docx Files with Python

This skill documents how to analyze `.docx` content (OpenXML), specifically focusing on reading text, identifying structure, and safely manipulating tracked changes (revisions).

## 1. Understanding the .docx Structure

A `.docx` file is a ZIP archive containing XML files. The most critical one for analysis is `word/document.xml`.

### Key XML Elements
*   **`<w:p>`**: Paragraph (block of text).
*   **`<w:r>`**: Run (inline text with formatting).
*   **`<w:t>`**: Text content.
*   **`<w:pPr>`**: Paragraph Properties (style, alignment).
*   **`<w:pStyle w:val="Heading1"/>`**: Defines the style of the paragraph (e.g., Header).
*   **`<w:ins>`**: Inserted text (Track Changes).
*   **`<w:del>`**: Deleted text (Track Changes).

## 2. Analyzing Content with python-docx

When using `python-docx`, you interact with `Document` objects, but often need to drop down to the underlying XML (`lxml`) for advanced features like Track Changes.

### Reading Paragraphs and Styles
```python
from docx import Document

doc = Document('file.docx')
for p in doc.paragraphs:
    # Access style name
    if p.style.name.startswith('Heading'):
        print(f"Header: {p.text}")
    
    # Access underlying XML element
    xml_element = p._p
```

### Detecting Tracked Changes
To find suggestions (insertions/deletions), iterate through the XML children of a paragraph:

```python
from docx.oxml.ns import qn

def get_changes(doc):
    changes = []
    for p in doc.paragraphs:
        # Iterate over all children (runs, ins, del)
        for child in p._p.iterchildren():
            if child.tag.endswith('ins'):
                # Insertion
                text = "".join([t.text for t in child.iter() if t.tag.endswith('t')])
                changes.append({"type": "insertion", "text": text, "id": child.get(qn('w:id'))})
            
            elif child.tag.endswith('del'):
                # Deletion
                text = "".join([t.text for t in child.iter() if t.tag.endswith('delText')])
                changes.append({"type": "deletion", "text": text, "id": child.get(qn('w:id'))})
    return changes
```

## 3. Generating Unique IDs for Revisions

When creating new `w:ins` or `w:del` elements, you MUST provide a unique `w:id`.
*   **Requirement**: A signed 32-bit integer.
*   **Risk**: `random.randint` can collide.
*   **Solution**: Use a masked UUID.

### Safe ID Generation Code
```python
import uuid
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import time

def create_tracked_insertion(text, author="AI_Reviewer"):
    date = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        
    run = OxmlElement('w:ins')
    
    # GENERATE UNIQUE ID
    # Use UUID masked to a positive 30-bit integer to ensure uniqueness and XML compliance
    unique_id = str(uuid.uuid4().int & (1<<30)-1)
    
    run.set(qn('w:id'), unique_id)
    run.set(qn('w:author'), author)
    run.set(qn('w:date'), date)
    
    r = OxmlElement('w:r')
    t = OxmlElement('w:t')
    t.text = text
    r.append(t)
    run.append(r)
    return run
```

This method ensures that every tracked change has a statistically unique ID, preventing corruption or merging of changes by Word.
