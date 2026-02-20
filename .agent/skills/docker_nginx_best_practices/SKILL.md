---
name: Docker and Nginx Best Practices
description: Guidelines for multi-stage Docker builds, asset inlining, and Nginx SSE configuration.
---

# Docker and Nginx Best Practices

This skill captures the specific configurations and strategies required to reliably deploy DocxAI, especially focusing on the ChatGPT integration challenges.

## 1. Docker Multi-Stage Build
Use a multi-stage approach to separate the React build environment from the Python runtime.

**Pattern:**
```dockerfile
# Stage 1: Build Frontend
FROM node:18-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.10-slim
COPY --from=builder /app/frontend/dist /app/frontend/dist
# ... copy backend and run ...
```

## 2. Nginx SSE Proxying
To support Server-Sent Events (SSE), Nginx must be configured to bypass buffering.

**Mandatory Config:**
- `proxy_buffering off`: Prevents Nginx from holding chunks.
- `proxy_set_header Connection ''`: Required for HTTP/1.1 streaming.
- `proxy_read_timeout 86400s`: Prevents the tunnel from closing during long AI responses.

## 3. Asset Inlining
For the ChatGPT panel to work, the frontend should be a single `index.html`.
- Run `python3 inline_assets.py` after the frontend build.
- This merges JS and CSS into the HTML, solving iframe asset loading issues.

## 4. Azure Deployment Requirements
- **Platform:** Always build for `linux/amd64`.
- **Admin Enabled:** Azure ACR needs `--admin-enabled true` for App Service to pull images.
- **Port:** Use `WEBSITES_PORT=80` in App Service settings to direct traffic to Nginx.

## 5. Troubleshooting Checklist
- **404 in Panel?** Verify `dist` folder was copied correctly in Dockerfile.
- **Blank Panel?** Run the inlining script and check for CSS injection.
- **SSE fails?** Check `nginx.conf` for `proxy_buffering off`.
- **Exec format error?** Check if the image was built for `linux/amd64`.
