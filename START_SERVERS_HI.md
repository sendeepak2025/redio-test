# 🚀 Servers Start Karo - Step by Step

## Problem
Backend server nahi chal raha hai! Isliye sab tests fail ho rahe hain.

## Solution - 3 Terminals Kholo

### Terminal 1: Backend Start Karo
```bash
cd server
npm start
```

**Yeh dikhna chahiye:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

### Terminal 2: Frontend Start Karo
```bash
cd viewer
npm start
```

**Yeh dikhna chahiye:**
```
Compiled successfully!
Local: http://localhost:3000
```

### Terminal 3: Test Karo (Servers start hone ke baad)
```bash
cd server
node test-series-backend.js
```

## Expected Output

### Backend Terminal:
```
🎯 SERIES-SPECIFIC ROUTE HIT
[SERIES IDENTIFIER - BACKEND] Series UID: ...888
[SERIES IDENTIFIER - BACKEND] Found instances: 2
```

### Test Output:
```
✅ Study metadata retrieved
✅ Frame retrieved successfully
✅ All series return DIFFERENT frames!
```

## Agar Backend Start Nahi Ho Raha

### MongoDB Check Karo
```bash
mongosh
```

Agar error aaye, MongoDB start karo:
```bash
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

### Port 5000 Check Karo
```bash
# Windows:
netstat -ano | findstr :5000

# Agar koi process chal rahi hai, kill karo:
taskkill /PID <PID> /F
```

## Quick Start

**3 Terminals Kholo:**

1. **Terminal 1:** `cd server && npm start`
2. **Terminal 2:** `cd viewer && npm start`
3. **Terminal 3:** Wait 10 seconds, then `cd server && node test-series-backend.js`

## Servers Start Hone Ke Baad

1. Test run karo: `node test-series-backend.js`
2. Browser kholo: `http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885`
3. Series selector dikhe ya nahi check karo
4. Different series par click karo
5. Images change ho rahe hain ya nahi dekho

## Troubleshooting

### "Cannot connect to MongoDB"
MongoDB start karo:
```bash
mongod --dbpath /path/to/data
```

### "Port 5000 already in use"
`server/.env` mein port change karo:
```
PORT=5001
```

### "Port 3000 already in use"
Process kill karo:
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

Servers start hone ke baad:
1. ✅ Test run karo
2. ✅ Output share karo
3. ✅ Browser mein test karo
4. ✅ Console logs share karo

Isse main exact problem identify kar sakta hoon!
