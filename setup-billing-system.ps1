# Radiology Billing System - Setup Script (PowerShell)

Write-Host "🏥 Radiology Billing System - Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
Set-Location server
npm install pdfkit
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Seed billing codes
Write-Host "🌱 Step 2: Seeding billing codes..." -ForegroundColor Yellow
node src/scripts/seed-billing-codes.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Billing codes seeded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to seed billing codes" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Check environment
Write-Host "🔍 Step 3: Checking environment configuration..." -ForegroundColor Yellow
if (Select-String -Path .env -Pattern "OPENAI_API_KEY" -Quiet) {
    Write-Host "✅ OpenAI API key configured (AI suggestions enabled)" -ForegroundColor Green
} else {
    Write-Host "⚠️  OpenAI API key not found (will use rule-based suggestions)" -ForegroundColor Yellow
    Write-Host "   To enable AI: Add OPENAI_API_KEY=sk-your-key to server/.env" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Verify setup
Write-Host "✅ Step 4: Verifying setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Billing System Components:" -ForegroundColor Cyan
Write-Host "  ✓ Models: BillingCode, DiagnosisCode, Superbill" -ForegroundColor White
Write-Host "  ✓ Service: AI Billing Service" -ForegroundColor White
Write-Host "  ✓ Controller: Billing Controller" -ForegroundColor White
Write-Host "  ✓ Routes: /api/billing/*" -ForegroundColor White
Write-Host "  ✓ Frontend: BillingPanel component" -ForegroundColor White
Write-Host "  ✓ Seed Data: 20+ CPT codes, 21+ ICD-10 codes" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start server: cd server; npm start" -ForegroundColor White
Write-Host "2. Test API: curl http://localhost:8001/api/billing/codes/cpt/search?query=chest" -ForegroundColor White
Write-Host "3. Read docs: BILLING_QUICK_START.md" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  • Quick Start: BILLING_QUICK_START.md" -ForegroundColor White
Write-Host "  • Full Guide: BILLING_SYSTEM_GUIDE.md" -ForegroundColor White
Write-Host "  • Workflow: BILLING_WORKFLOW_DIAGRAM.md" -ForegroundColor White
Write-Host ""

Set-Location ..
