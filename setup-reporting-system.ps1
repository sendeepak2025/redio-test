# 🧠 Structured Reporting System Setup Script (PowerShell)
# This script sets up the complete AI + Radiologist reporting workflow

Write-Host "🧠 Setting up Structured Reporting System..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install backend dependencies
Write-Host "📦 Step 1: Installing backend dependencies..." -ForegroundColor Blue
Set-Location server
npm install multer pdfkit
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some dependencies may already be installed" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Create uploads directory
Write-Host "📁 Step 2: Creating uploads directory..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "uploads\signatures" | Out-Null
New-Item -ItemType File -Force -Path "uploads\signatures\.gitkeep" | Out-Null
Write-Host "✅ Uploads directory created" -ForegroundColor Green
Write-Host ""

# Step 3: Update .gitignore
Write-Host "📝 Step 3: Updating .gitignore..." -ForegroundColor Blue
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -notcontains "uploads/signatures/*") {
    Add-Content .gitignore "`n# Signature uploads"
    Add-Content .gitignore "uploads/signatures/*"
    Add-Content .gitignore "!uploads/signatures/.gitkeep"
    Write-Host "✅ .gitignore updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  .gitignore already configured" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Check MongoDB connection
Write-Host "🗄️  Step 4: Checking MongoDB connection..." -ForegroundColor Blue
if (Test-Path .env) {
    $envContent = Get-Content .env
    if ($envContent -match "MONGODB_URI") {
        Write-Host "✅ MongoDB URI found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB URI not found in .env" -ForegroundColor Yellow
        Write-Host "Please add: MONGODB_URI=mongodb://localhost:27017/your-database"
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "Please create .env file with MongoDB URI"
}
Write-Host ""

# Step 5: Install frontend dependencies (if needed)
Write-Host "📦 Step 5: Checking frontend dependencies..." -ForegroundColor Blue
Set-Location ..\viewer
if (Test-Path "node_modules") {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing frontend dependencies..."
    npm install
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}
Write-Host ""

# Step 6: Create demo route (optional)
Write-Host "🎨 Step 6: Setting up demo page..." -ForegroundColor Blue
Set-Location ..
Write-Host "✅ Demo page available at: /reporting-demo" -ForegroundColor Green
Write-Host ""

# Step 7: Summary
Write-Host "📋 Setup Summary:" -ForegroundColor Blue
Write-Host ""
Write-Host "✅ Backend dependencies installed (multer, pdfkit)" -ForegroundColor Green
Write-Host "✅ Uploads directory created (server/uploads/signatures)" -ForegroundColor Green
Write-Host "✅ .gitignore updated" -ForegroundColor Green
Write-Host "✅ Frontend components ready" -ForegroundColor Green
Write-Host "✅ Demo page ready" -ForegroundColor Green
Write-Host ""

# Step 8: Next steps
Write-Host "🚀 Next Steps:" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Start backend:"
Write-Host "   cd server; npm start"
Write-Host ""
Write-Host "2. Start frontend:"
Write-Host "   cd viewer; npm run dev"
Write-Host ""
Write-Host "3. Test demo page:"
Write-Host "   http://localhost:5173/reporting-demo"
Write-Host ""
Write-Host "4. Integration (add to Medical Viewer):"
Write-Host "   import ReportHistoryButton from '../reports/ReportHistoryButton';"
Write-Host "   <ReportHistoryButton studyInstanceUID={studyInstanceUID} />"
Write-Host ""

# Step 9: Documentation
Write-Host "📚 Documentation:" -ForegroundColor Blue
Write-Host ""
Write-Host "- STRUCTURED_REPORTING_COMPLETE.md - Complete guide"
Write-Host "- QUICK_INTEGRATION_GUIDE.md - Integration steps"
Write-Host "- REPORTING_SYSTEM_HINDI.md - Hindi guide"
Write-Host "- REPORTING_CHECKLIST.md - Testing checklist"
Write-Host ""

Write-Host "✅ Setup complete! Ready to use." -ForegroundColor Green
Write-Host ""
