---
name: frontend_development_pnpm
description: Workflow for creating and managing frontend projects using PNPM instead of npm/yarn.
---

# Frontend Development with PNPM (Performance NPM)

This skill mandates the use of `pnpm` for all frontend package management tasks, ensuring faster installations, disk space efficiency, and strict dependency resolution.

## 1. Installation

If `pnpm` is not installed, install it via:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
# OR via Homebrew
brew install pnpm
```

## 2. Project Initialization

Instead of `npm create` or `yarn create`, use:
```bash
pnpm create vite <project-name> --template <template>
# Example: pnpm create vite frontend --template react
```

- If a project was accidentally initialized with `npm` (creating `package-lock.json`), immediately:
    1. Delete `package-lock.json`.
    2. Delete `node_modules`.
    3. Run `pnpm install` to generate `pnpm-lock.yaml`.

## 3. Dependency Management

- **Install Dependencies**: `pnpm install` (or `pnpm i`)
- **Add Dependency**: `pnpm add <package-name>`
- **Add Dev Dependency**: `pnpm add -D <package-name>`
- **Run Scripts**: `pnpm run <script-name>` (e.g., `pnpm dev`, `pnpm build`)

## 4. Key Differences from NPM

- **Strict Mode**: pnpm uses a content-addressable store. Dependencies of dependencies are not flatted into the root `node_modules` like npm unless explicitly configured ("hoisting"). This prevents "phantom dependencies" (accessing packages not listed in `package.json`).
- **Workspace Support**: Use `pnpm-workspace.yaml` for monorepos involving multiple packages.

## 5. Troubleshooting

- If module resolution fails due to strictness, check `shamefully-hoist=true` in `.npmrc` as a workaround, but prefer adding missing dependencies explicitly.

## Example Workflow

```bash
# Setup new frontend
pnpm create vite my-app --template react-ts
cd my-app
pnpm install
pnpm add axios lucide-react

# Run dev server
pnpm dev
```
