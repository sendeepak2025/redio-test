# PowerShell Login Test Script
# Test login for both superadmin and hospital users

Write-Host "🚀 Testing Login System" -ForegroundColor Cyan
Write-Host "Server: http://localhost:8001" -ForegroundColor Gray
Write-Host "=" * 60

# Test 1: Super Admin Login (Username)
Write-Host "`n🧪 Test 1: Super Admin Login (Username)" -ForegroundColor Yellow
$body1 = @{
    username = "superadmin"
    password = "12345678"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body1

    if ($response1.success) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response1.user.username) ($($response1.user.email))" -ForegroundColor White
        Write-Host "   Role: $($response1.role)" -ForegroundColor White
        Write-Host "   Hospital ID: $($response1.hospitalId)" -ForegroundColor White
        Write-Host "   Roles: $($response1.user.roles -join ', ')" -ForegroundColor White
    } else {
        Write-Host "   ❌ Login failed: $($response1.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Super Admin Login (Email)
Write-Host "`n🧪 Test 2: Super Admin Login (Email)" -ForegroundColor Yellow
$body2 = @{
    email = "superadmin@gmail.com"
    password = "12345678"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body2

    if ($response2.success) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response2.user.username) ($($response2.user.email))" -ForegroundColor White
        Write-Host "   Role: $($response2.role)" -ForegroundColor White
        Write-Host "   Hospital ID: $($response2.hospitalId)" -ForegroundColor White
    } else {
        Write-Host "   ❌ Login failed: $($response2.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Hospital Admin Login (Username)
Write-Host "`n🧪 Test 3: Hospital Admin Login (Username)" -ForegroundColor Yellow
$body3 = @{
    username = "hospital"
    password = "123456"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body3

    if ($response3.success) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response3.user.username) ($($response3.user.email))" -ForegroundColor White
        Write-Host "   Role: $($response3.role)" -ForegroundColor White
        Write-Host "   Hospital ID: $($response3.hospitalId)" -ForegroundColor White
        Write-Host "   Roles: $($response3.user.roles -join ', ')" -ForegroundColor White
    } else {
        Write-Host "   ❌ Login failed: $($response3.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Hospital Admin Login (Email)
Write-Host "`n🧪 Test 4: Hospital Admin Login (Email)" -ForegroundColor Yellow
$body4 = @{
    email = "hospital@gmail.com"
    password = "123456"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body4

    if ($response4.success) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response4.user.username) ($($response4.user.email))" -ForegroundColor White
        Write-Host "   Role: $($response4.role)" -ForegroundColor White
        Write-Host "   Hospital ID: $($response4.hospitalId)" -ForegroundColor White
    } else {
        Write-Host "   ❌ Login failed: $($response4.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Default Admin Login
Write-Host "`n🧪 Test 5: Default Admin Login (Username)" -ForegroundColor Yellow
$body5 = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response5 = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body5

    if ($response5.success) {
        Write-Host "   ✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response5.user.username) ($($response5.user.email))" -ForegroundColor White
        Write-Host "   Role: $($response5.role)" -ForegroundColor White
        Write-Host "   Hospital ID: $($response5.hospitalId)" -ForegroundColor White
    } else {
        Write-Host "   ❌ Login failed: $($response5.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60)
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Test in browser: http://localhost:5173/login" -ForegroundColor White
Write-Host "2. Login as superadmin → should redirect to /superadmin" -ForegroundColor White
Write-Host "3. Login as hospital → should redirect to /dashboard" -ForegroundColor White
