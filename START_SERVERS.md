# 🚀 Start Servers - Step by Step

## Problem
Backend server nahi chal raha hai, isliye sab tests fail ho rahe hain.

## Solution - 3 Terminals Kholo

### Terminal 1: Backend Server
```bash
cd server
npm start
```

**Wait for:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

### Terminal 2: Frontend Server
```bash
cd viewer
npm start
```

**Wait for:**
```
Compiled successfully!
Local: http://localhost:3000
```

### Terminal 3: Test Backend (After servers start)
```bash
cd server
node test-series-backend.js
```

## Expected Output

### Backend Terminal (Terminal 1):
```
🎯 SERIES-SPECIFIC ROUTE HIT: { seriesUid: '...888' }
[SERIES IDENTIFIER - BACKEND] Frame request received
[SERIES IDENTIFIER - BACKEND] Series UID: ...888
[SERIES IDENTIFIER - BACKEND] ✅ Filtering by series
[SERIES IDENTIFIER - BACKEND] Found instances: 2
```

### Test Output (Terminal 3):
```
✅ Study metadata retrieved
   Number of Series: 3
   Total Instances: 266

✅ Frame retrieved successfully
   Content-Type: image/png
   Size: 45.23 KB

✅ All series return DIFFERENT frames!
```

## If Backend Won't Start

### Check MongoDB
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

### Check Port 5000
```bash
# Windows:
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :5000
```

If port is in use, kill the process or change port in `.env`:
```
PORT=5001
```

## Quick Start Script

Create `start-all.bat` (Windows) or `start-all.sh` (Mac/Linux):

**Windows (start-all.bat):**
```batch
@echo off
echo Starting Backend...
start cmd /k "cd server && npm start"

timeout /t 5

echo Starting Frontend...
start cmd /k "cd viewer && npm start"

echo Servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
```

**Mac/Linux (start-all.sh):**
```bash
#!/bin/bash
echo "Starting Backend..."
cd server && npm start &

sleep 5

echo "Starting Frontend..."
cd viewer && npm start &

echo "Servers starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
```

Run:
```bash
# Windows
start-all.bat

# Mac/Linux
chmod +x start-all.sh
./start-all.sh
```

## After Servers Start

1. Wait 10 seconds for servers to fully start
2. Run test: `node test-series-backend.js`
3. Open browser: `http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885`
4. Check if series selector appears
5. Click different series and check if images change

## Troubleshooting

### Backend Error: "Cannot connect to MongoDB"
```bash
# Start MongoDB
mongod --dbpath /path/to/data
```

### Backend Error: "Port 5000 already in use"
Change port in `server/.env`:
```
PORT=5001
```

Then update frontend API URL in `viewer/src/services/ApiService.ts`:
```typescript
const BACKEND_URL = 'http://localhost:5001'
```

### Frontend Error: "Port 3000 already in use"
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

## Next Steps

After servers start successfully:
1. Run `node test-series-backend.js`
2. Share the output
3. Open browser and test manually
4. Share browser console logs

This will help identify if the problem is in backend or frontend!
