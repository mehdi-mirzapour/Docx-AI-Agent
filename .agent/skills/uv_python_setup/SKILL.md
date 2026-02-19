---
name: create_uv_python_project
description: Instructions for creating Python projects using the uv package manager and managing API keys with .env.
---

# UV-Based Python Project Creation

This skill provides a standardized workflow for initializing and managing Python projects using the [uv](https://astral.sh/uv) package coordinator. It ensures modern dependency management, fast package resolution, and secure environment configuration.

## Requirements

-   **Installation**:
    -   Install `uv` if not already present: `curl -LsSf https://astral.sh/uv/install.sh | sh` (or `brew install uv` on macOS).
    -   Do NOT install python using system package managers if avoidable; `uv` manages python versions effectively.

## Project Initialization

1.  **Initialize Project**:
    -   Use `uv init <project-name>` to create a new project directory with standard layout.
    -   Or `uv init .` in an existing directory.
    -   This creates a `pyproject.toml` automatically.

2.  **Virtual Environment**:
    -   Create and activate a virtual environment:
        ```bash
        uv venv
        source .venv/bin/activate
        ```
    -   Alternatively, use `uv run <command>` to run tools in an ephemeral or persistent environment without explicit activation.

3.  **Python Version Management**:
    -   Specify Python version if needed: `uv python install 3.12` (or desired version).
    -   Pin version in `pyproject.toml` via `requires-python`.

## Dependency Management

-   **Adding Packages**:
    -   Use `uv add <package>` instead of `pip install`.
    -   Examples:
        -   `uv add requests`
        -   `uv add --dev pytest ruff` (for development dependencies)

-   **Syncing**:
    -   `uv sync` ensures the environment matches `uv.lock`.

## Environment Variables & Security

1.  **Secret Management**:
    -   ALWAYS use a `.env` file for API keys, database URLs, and other secrets.
    -   NEVER hardcode secrets in Python files.

2.  **Implementation**:
    -   Add `python-dotenv` as a dependency:
        ```bash
        uv add python-dotenv
        ```
    -   Create a `.env` file in the root:
        ```bash
        echo "API_KEY=your_secret_here" > .env
        ```
    -   Load it in your application entry point:
        ```python
        from dotenv import load_dotenv
        import os

        load_dotenv()

        api_key = os.getenv("API_KEY")
        if not api_key:
            raise ValueError("API_KEY not found in environment variables")
        ```

3.  **Git Configuration**:
    -   Ensure `.env` is ignored by git to prevent leaks.
    -   Add to `.gitignore`:
        ```text
        .env
        .venv/
        __pycache__/
        ```

## Example Workflow

```bash
# 1. Create project
mkdir my-project
cd my-project
uv init .

# 2. Add dependencies
uv add requests python-dotenv

# 3. Setup environment
echo "API_KEY=12345" > .env
echo ".env" >> .gitignore

# 4. Create main.py
cat <<EOF > main.py
import os
from dotenv import load_dotenv

load_dotenv()
print(f"API Key loaded: {bool(os.getenv('API_KEY'))}")
EOF

# 5. Run
uv run main.py
```
