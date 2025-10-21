# PowerShell Login Commands

## Quick Test Commands

### Test Super Admin Login (Username)
```powershell
$body = @{username="superadmin"; password="12345678"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -ContentType "application/json" -Body $body
```

### Test Super Admin Login (Email)
```powershell
$body = @{email="superadmin@gmail.com"; password="12345678"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -ContentType "application/json" -Body $body
```

### Test Hospital Admin Login (Username)
```powershell
$body = @{username="hospital"; password="123456"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -ContentType "application/json" -Body $body
```

### Test Hospital Admin Login (Email)
```powershell
$body = @{email="hospital@gmail.com"; password="123456"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -ContentType "application/json" -Body $body
```

### Test Default Admin Login
```powershell
$body = @{username="admin"; password="admin123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -ContentType "application/json" -Body $body
```

## Run Automated Test Script

```powershell
.\test-login-powershell.ps1
```

## Expected Output

### Super Admin Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "superadmin",
    "email": "superadmin@gmail.com",
    "firstName": "Super",
    "lastName": "Admin",
    "roles": ["system:admin", "super_admin"],
    "permissions": ["*"],
    "hospitalId": null,
    "isActive": true
  },
  "role": "superadmin",
  "hospitalId": null
}
```

### Hospital Admin Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "hospital",
    "email": "hospital@gmail.com",
    "firstName": "Hospital",
    "lastName": "Admin",
    "roles": ["admin", "radiologist"],
    "permissions": ["studies:read", "studies:write", "patients:read", "patients:write", "users:read"],
    "hospitalId": "HOSP001",
    "isActive": true
  },
  "role": "admin",
  "hospitalId": "HOSP001"
}
```

## Troubleshooting

### Error: "Unable to connect to the remote server"
- Make sure the backend server is running on port 8001
- Check: `http://localhost:8001/health`

### Error: "Invalid credentials"
- Verify the username/email and password are correct
- Check if users are seeded in the database

### Error: "No response"
- Check if MongoDB is connected
- Check server logs for errors

## Alternative: Use Node.js Test Script

If PowerShell commands don't work, use the Node.js test script:

```powershell
node test-login.js
```

This will test all login methods automatically.
