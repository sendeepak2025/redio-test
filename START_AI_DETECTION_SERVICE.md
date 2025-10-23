# ⚡ Start AI Detection Service - Quick Commands

## 🚀 **3 Commands to Get Running**

### 1. Install

```bash
cd ai-detection-node
npm install
```

### 2. Start

```bash
npm start
```

### 3. Connect

Edit `server/.env`:
```bash
AI_DETECTION_URL=http://localhost:5004
```

Restart backend:
```bash
cd server
npm start
```

**Done!** 🎉

---

## ✅ **Verify It's Working**

### Test Health:

```bash
curl http://localhost:5004/health
```

**Expected:**
```json
{
  "status": "healthy",
  "service": "AI Detection Service"
}
```

### Test in Viewer:

1. Open study
2. Click "AI Analysis"
3. Click "RUN AI ANALYSIS"
4. **See detections!** 🎯

---

## 🌐 **Deploy to Production**

### Easiest: Railway (Free)

```bash
npm install -g @railway/cli
railway login
cd ai-detection-node
railway init
railway up
```

Get your URL and update `.env`:

```bash
AI_DETECTION_URL=https://your-service.up.railway.app
```

---

## 📊 **What You'll See**

### In Your Viewer:

```
🎯 AI Detected Abnormalities (2)

┌─────────────────────────────────────┐
│ Finding: Consolidation              │
│ Location: (35%, 45%)                │
│ Confidence: ████████░░ 78%          │
│ Severity: 🟡 MEDIUM                 │
│ Measurements: Area: 3.2 cm²         │
│                                     │
│ Description:                        │
│ Possible consolidation detected...  │
│                                     │
│ Recommendations:                    │
│ • Radiologist review recommended    │
│ • Clinical correlation advised      │
└─────────────────────────────────────┘
```

---

## 🎯 **Quick Reference**

### Start Service:
```bash
cd ai-detection-node && npm start
```

### Stop Service:
```bash
Ctrl + C
```

### Check Logs:
```bash
# Logs appear in terminal
```

### Test Endpoint:
```bash
curl http://localhost:5004/health
```

### Deploy:
```bash
railway up
```

---

## 📁 **Files**

```
ai-detection-node/
├── server.js              ← Main service
├── package.json           ← Dependencies
├── README.md              ← Full docs
├── QUICK_START.md         ← This guide
└── DEPLOYMENT_GUIDE.md    ← Deploy options
```

---

## 🎉 **That's It!**

Your AI detection service is ready to use!

**Start it now:**
```bash
cd ai-detection-node
npm install
npm start
```

**Then connect it to your PACS and start detecting!** 🚀
