# ============================================================
# deploy-frontend.ps1
# Baut das React-Frontend und deployt es zu S3 + CloudFront.
#
# Einmalige Voraussetzungen:
#   1. AWS CLI installiert und konfiguriert
#   2. S3-Bucket für Frontend erstellt:
#      aws s3api create-bucket --bucket hifly-frontend --region eu-north-1 --create-bucket-configuration LocationConstraint=eu-north-1
#   3. CloudFront-Distribution erstellt (AWS Console):
#      Origin: hifly-frontend S3-Bucket (mit OAC)
#      Default root object: index.html
#      Error page 403/404 → /index.html (für React Router)
#   4. frontend/.env.production mit App Runner URL befüllt
# ============================================================

$ErrorActionPreference = "Stop"

# ---- Konfiguration (einmalig anpassen) ---------------------
$S3_BUCKET          = "hifly-frontend"
$CLOUDFRONT_DIST_ID = "E33R9CH19HQMB1"
$AWS_REGION         = "eu-north-1"
# ------------------------------------------------------------

$FRONTEND_DIR = "$PSScriptRoot\..\frontend"

# Prüfen ob .env.production existiert
if (-not (Test-Path "$FRONTEND_DIR\.env.production")) {
    Write-Host "FEHLER: frontend/.env.production fehlt!" -ForegroundColor Red
    Write-Host "Kopiere .env.production.example und befülle VITE_API_BASE_URL mit der App Runner URL."
    exit 1
}

Write-Host "==> Frontend bauen..." -ForegroundColor Cyan
Set-Location $FRONTEND_DIR
npm run build

Write-Host "==> Zu S3 hochladen..." -ForegroundColor Cyan
# --delete entfernt alte Dateien die nicht mehr im Build sind
aws s3 sync dist/ "s3://$S3_BUCKET" --region $AWS_REGION --delete

Write-Host "==> CloudFront Cache invalidieren..." -ForegroundColor Cyan
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

Write-Host "==> Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "    Die neue Version ist in ~1 Minute live."
