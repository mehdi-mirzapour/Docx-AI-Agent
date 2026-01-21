#!/bin/bash
echo "🚀 Starting DocxAI Fix & Deploy..."

# 1. Stop existing containers and clean images
echo "🛑 Stopping old containers and removing images..."
docker rm -f docx-mcp frontend mcp nginx 2>/dev/null || true
docker rmi -f docx-mcp nginx 2>/dev/null || true
pkill -f "python server.py" || true

# 2. Start services using Docker Compose
echo "🔨 Building and Starting containers..."
if [ ! -f .env ]; then
    echo "⚠️ .env file not found! Please ensure OPENAI_API_KEY is set."
fi

# Load env vars from .env for the script execution context
export $(grep -v '^#' .env | xargs)

docker-compose down --rmi all --remove-orphans 2>/dev/null || true
docker-compose up --build -d

echo "📊 Checking running containers..."
docker-compose ps

# 4. Restart ngrok
echo "🌐 Restarting ngrok..."
pkill -f ngrok || true
ngrok http 8787 > ngrok.log 2>&1 &

echo "⏳ Waiting for services to stabilize..."
sleep 5

# 5. Show URL
echo "✅ DONE! Use this URL in ChatGPT:"
curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*'
echo ""
echo "If the URL is empty above, verify at http://localhost:4040"
