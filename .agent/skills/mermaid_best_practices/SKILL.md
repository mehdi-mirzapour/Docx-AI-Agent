---
name: Mermaid Diagram Best Practices
description: Guidelines for creating stable, error-free Mermaid diagrams by avoiding emojis and simplifying node identifiers.
---

# Mermaid Diagram Best Practices

This project uses Mermaid diagrams for architecture documentation. Based on past fixes, follow these rules to avoid rendering errors.

## 1. Avoid Special Characters in Identifiers
Do not use spaces or emojis in the node identifiers (the part inside the brackets or the variable name).

❌ **Bad:**
`graph TD; 🚀Start --> |Files| 🛠Processor`

✅ **Good:**
`graph TD; Start[🚀 Start] --> |Files| Processor[🛠 Processor]`

## 2. Use Quotes for Descriptive Text
If you want to use symbols or spaces in the displayed text, wrap it in brackets and quotes.

`NodeA["My App (v1.0)"]`

## 3. Direction Consistency
Standardize on `graph TD` (Top Down) for architecture and `graph LR` (Left to Right) for sequence-like flows.

## 4. Troubleshooting
If a README diagram is broken:
- Check for unclosed parentheses `(` or brackets `[` .
- Ensure there are no reserved words used as node IDs (e.g., `end`, `subgraph` without indentation).
- Test the syntax in the [Mermaid Live Editor](https://mermaid.live/) before committing.
