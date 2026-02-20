---
name: Azure Deployment Strategies
description: Multi-method deployment guide for DocxAI on Azure, covering ASA, ACA, AKS, VM, and VMSS.
---

# Azure Deployment Strategies for DocxAI

This skill provides the instructions and documentation for deploying the DocxAI solution (FastAPI Backend, React Frontend, and Nginx Gateway) using various Azure services.

## Comparison Overview

| Feature | App Service (ASA) | Container Apps (ACA) | Kubernetes (AKS) | Virtual Machine (VM) | VM Scale Set (VMSS) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Complexity** | Low | Medium | High | Medium | Medium-High |
| **Auto-scaling** | Basic | Native (KEDA) | Fine-grained | Manual | **Native Auto-scaling** |
| **Cost Model** | Monthly Plan | Pay-per-use | Cluster + Nodes | Fixed Monthly | Variable (Nodes) |
| **Best For** | Small/Mid Business | Serverless/Microservices | Enterprise Scale | Full Control | High-Load/Reliability |

---

## 1. Azure App Service (ASA)
**Strategy:** Multi-container Docker Compose. Perfect for "Set it and forget it" standard web apps.
- **Reference File:** `ASA_DEPLOYMENT.md`
- **Deployment Script:** `deploy-azure.sh`
- **Key Command:** `az webapp create --multicontainer-config-file docker-compose-azure.yml`

## 2. Azure Container Apps (ACA)
**Strategy:** Serverless container platform. Ideal for cost-efficiency and scaling to zero.
- **Reference File:** `ACA_DEPLOYMENT.md`
- **Deployment Script:** `deploy-aca.sh`
- **Key Command:** `az containerapp create --ingress external --target-port 80` (for Nginx)

## 3. Azure Kubernetes Service (AKS)
**Strategy:** Full-scale orchestration. Best for complex, high-availability production environments.
- **Reference File:** `AKS_DEPLOYMENT.md`
- **Deployment Script:** `deploy-aks.sh`
- **Key Manifest:** `k8s-deployment.yaml`

## 4. Azure Virtual Machine (VM)
**Strategy:** IaaS deployment using Docker Compose on a single Ubuntu instance.
- **Reference File:** `VM_DEPLOYMENT.md`
- **Workflow:** SSH + `docker-compose up -d`.
- **Pros:** Full OS access, predictable fixed pricing.

## 5. Azure VM Scale Set (VMSS)
**Strategy:** A fleet of identical VMs with native auto-scaling and load balancing.
- **Reference File:** `VMSS_DEPLOYMENT.md`
- **Automation:** Use `cloud-init` to provision Docker and pull the app code across the fleet.

---

## Workflow: Choosing a Strategy
1. **Developer / Prototype:** Use Local/Ngrok (see `DOCKER_GUIDE.md`).
2. **Small Production:** Use **Azure App Service (ASA)** via `deploy-azure.sh`.
3. **Cost-Sensitive / Bursty Traffic:** Use **Azure Container Apps (ACA)**.
4. **Mission Critical / High Scale:** Use **AKS** or **VMSS**.
5. **Legacy / Full Control:** Use **Single VM**.
