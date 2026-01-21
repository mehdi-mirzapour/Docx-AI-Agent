# 🚀 Azure Deployment Guide - DocxAI (Multi-Container)

This document details how to deploy your **3-Docker Architecture** (MCP, Frontend, Nginx) to Azure.

## 🏗️ Architecture: "Three Dockers on One Service"

Instead of managing 3 separate servers, we run all 3 containers on **one** Azure App Service using Docker Compose.

```
                  ┌───────────────────────────────┐
                  │      Azure App Service        │
                  │    (Multi-Container Mode)     │
[User/ChatGPT] ──▶│ [Nginx Gateway] (Port 80)     │
                  │       │          │            │
                  │       ▼          ▼            │
                  │  [Frontend]    [MCP API]      │
                  └───────────────────────────────┘
```

### Is there a conflict with Azure Front Door?
**No.**
- **Azure Front Door**: Your "Global Doorman". It handles caching, WAF security, and closest-user routing. It passes traffic to your App Service.
- **Nginx (Container)**: Your "Internal Receptionist". It sits *inside* your App Service and routes traffic to the correct container (Frontend vs MCP).
- **They work perfectly together.** Front Door -> App Service (Nginx) -> Containers.

---

## 1. Prerequisites (Azure CLI)
Login to Azure:
```bash
az login
az account set --subscription "<your-subscription-id>"
```

## 2. Infrastructure Setup (Cheap & Simple)

### A. Create Resource Group & Registry
```bash
# 1. Resource Group
az group create --name docxai-rg --location westeurope

# 2. Container Registry (ACR)
az acr create --resource-group docxai-rg --name docxaiunique123 --sku Basic --admin-enabled true

# Login to ACR locally
az acr login --name docxaiunique123
```

### B. Build & Push Images
We need to push your 3 custom images.

```bash
# Set your registry name
export ACR_NAME=docxaiunique123

# 1. Build & Push MCP
docker build -f Dockerfile.mcp -t $ACR_NAME.azurecr.io/docxai-mcp:latest .
docker push $ACR_NAME.azurecr.io/docxai-mcp:latest

# 2. Build & Push Frontend
docker build -f Dockerfile.frontend -t $ACR_NAME.azurecr.io/docxai-frontend:latest .
docker push $ACR_NAME.azurecr.io/docxai-frontend:latest

# 3. Build & Push Nginx Gateway
docker build -f Dockerfile.nginx -t $ACR_NAME.azurecr.io/docxai-nginx:latest .
docker push $ACR_NAME.azurecr.io/docxai-nginx:latest
```

## 3. Deploy to Azure App Service

### A. Create App Service Plan
```bash
# Create Plan (Linux / B1 Tier - approx $13/mo)
az appservice plan create --name docxai-plan --resource-group docxai-rg --sku B1 --is-linux
```

### B. Create the Web App
We create **one** app that runs the provided `docker-compose-azure.yml`.

1. **Prepare `docker-compose-azure.yml`**: Ensure it uses your ACR image paths (replace `${DOCKER_REGISTRY}` with `docxaiunique123.azurecr.io`).

2. **Create the App**:
```bash
az webapp create \
  --resource-group docxai-rg \
  --plan docxai-plan \
  --name docxai-app-production \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose-azure.yml
```

3. **Configure Settings**:
```bash
# Set Registry Credentials & API Key
export ACR_PASS=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

az webapp config appsettings set \
  --resource-group docxai-rg \
  --name docxai-app-production \
  --settings \
  DOCKER_REGISTRY_SERVER_URL="https://$ACR_NAME.azurecr.io" \
  DOCKER_REGISTRY_SERVER_USERNAME=$ACR_NAME \
  DOCKER_REGISTRY_SERVER_PASSWORD=$ACR_PASS \
  DOCKER_REGISTRY=$ACR_NAME.azurecr.io \
  OPENAI_API_KEY="your-openai-key-here" \
  WEBSITES_PORT=80
```
*Note: `WEBSITES_PORT=80` tells Azure to listen to the Nginx container.*

## 4. (Optional) Add Azure Front Door

If you want global caching or WAF:

1. Create a **Front Door** profile.
2. Create an **Origin Group** pointing to `docxai-app-production.azurewebsites.net`.
3. Front Door will forward traffic to your App Service.
4. Your App Service (Nginx) will accept it and route it internally.
