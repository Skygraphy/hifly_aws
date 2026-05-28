# ============================================================
# deploy-backend.ps1
# Baut das Docker-Image und pusht es zu AWS ECR.
# App Runner deployed danach automatisch die neue Version.
#
# Einmalige Voraussetzungen:
#   1. AWS CLI installiert und konfiguriert (aws configure)
#   2. Docker Desktop läuft
#   3. ECR-Repository erstellt:
#      aws ecr create-repository --repository-name hifly-backend --region eu-north-1
#   4. App Runner Service erstellt (einmalig in AWS Console oder CLI)
# ============================================================

$ErrorActionPreference = "Stop"

# ---- Konfiguration (einmalig anpassen) ---------------------
$AWS_ACCOUNT_ID = "DEINE-AWS-ACCOUNT-ID"   # z.B. 123456789012
$AWS_REGION     = "eu-north-1"
$ECR_REPO       = "hifly-backend"
$IMAGE_TAG      = "latest"
# ------------------------------------------------------------

$ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

Write-Host "==> ECR Login..." -ForegroundColor Cyan
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

Write-Host "==> Docker Image bauen..." -ForegroundColor Cyan
docker build -t "$ECR_REPO`:$IMAGE_TAG" "$PSScriptRoot\..\backend"

Write-Host "==> Image taggen..." -ForegroundColor Cyan
docker tag "$ECR_REPO`:$IMAGE_TAG" "$ECR_URI`:$IMAGE_TAG"

Write-Host "==> Image zu ECR pushen..." -ForegroundColor Cyan
docker push "$ECR_URI`:$IMAGE_TAG"

Write-Host "==> Fertig! App Runner erkennt das neue Image und deployed automatisch." -ForegroundColor Green
Write-Host "    Image: $ECR_URI`:$IMAGE_TAG"
