# 🐳 Docker & Nginx Best Practices for DocxAI

Deployment of DocxAI involves a complex interaction between a React frontend, a Python/FastAPI backend, and an Nginx gateway. During development, we overcame several critical hurdles related to containerization and traffic routing.

## 1. Multi-Stage Docker Builds
**Problem:** A standard Dockerfile would either be too large (including all Node.js and Python dependencies) or miss the frontend build.
**Best Practice:** Use multi-stage builds.
- **Stage 1 (Node):** Build the React assets.
- **Stage 2 (Python):** Run the server and copy only the final `dist/` folder from Stage 1.
- **Benefit:** Smaller final image and clear separation of concerns.

## 2. Asset Inlining for ChatGPT Widgets
**Problem:** ChatGPT's iframe environments often block cross-origin relative paths for CSS and JS files, causing "Blank Pages."
**Best Practice:** Inline your assets. 
- Use a script (like `inline_assets.py`) to inject the contents of `.js` and `.css` directly into the `index.html`.
- This creates a **Single File Component** that is immune to pathing issues and loads reliably through an Ngrok tunnel.

## 3. Nginx Configuration for SSE (Server-Sent Events)
**Problem:** Nginx's default buffering ruins the "streaming" experience of ChatGPT by waiting for the entire response to be ready.
**Best Practice:** Disable buffering and set deep timeouts for the `/sse` route.
```nginx
location /sse {
    proxy_pass http://mcp:8787/sse;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    chunked_transfer_encoding off;
    proxy_read_timeout 86400s;
}
```

## 4. Cross-Platform Builds (AMD64 vs ARM64)
**Problem:** Building images on an Apple Silicon (M1/M2/M3) Mac and pushing them to Azure often causes "Exec format error" because Azure uses AMD64.
**Best Practice:** Always specify the platform in the build command.
```bash
docker build --platform linux/amd64 -t my-image:latest .
```

## 5. Port and Instance Cleanup
**Problem:** Port 8787 or 80 being busy prevents Docker from starting, leading to vague "Connection Refused" errors.
**Best Practice:** Use a cleanup script before every deployment (`restart-all.sh`) that stops all related containers and kills processes on locked ports.

## 6. Docker Desktop networking on Mac
**Problem:** `localhost` inside a Docker container refers to the container itself, not the host Mac.
**Best Practice:** Use `host.docker.internal` if a container needs to talk to a service running directly on the Mac, or use Docker Compose's internal service names (e.g., `http://mcp:8787`) if both are inside the same Docker network.
