# PowerShell script to test Structured Reports API

Write-Host "🧪 Testing Structured Reports API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Test route (no auth required)
Write-Host "Test 1: Testing /api/structured-reports/test" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/structured-reports/test" -Method Get
    Write-Host "✅ Test route works!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test route failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Backend might not be running or route not registered" -ForegroundColor Yellow
    Write-Host "Run: cd server && npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed! API is working." -ForegroundColor Green
Write-Host ""
Write-Host "Next: Test in frontend" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3010" -ForegroundColor Gray
Write-Host "2. Run AI analysis" -ForegroundColor Gray
Write-Host "3. Click 'Create Medical Report'" -ForegroundColor Gray
Write-Host "4. Should work! 🎉" -ForegroundColor Gray
