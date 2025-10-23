# 🤖 Complete AI Setup Guide
## Three Modes: Real AI | Cloud APIs | Enhanced Demo

---

## 🎯 Overview

Your AI system now supports **THREE MODES**:

1. **REAL AI MODE** - Use actual deep learning models locally
2. **CLOUD API MODE** - Connect to Google/AWS/Azure medical AI
3. **ENHANCED DEMO MODE** - Realistic simulation for testing (current)

---

## 📊 Current Status

```
✅ Enhanced Demo Mode: ACTIVE
❌ Real AI Mode: Not configured
❌ Cloud API Mode: Not configured
```

**You're currently in ENHANCED DEMO MODE** - Results are based on image analysis but NOT real medical AI.

---

## 🚀 OPTION 1: Real AI Mode (Best for Production)

### What You Get:
- ✅ Actual deep learning models
- ✅ Real medical image analysis
- ✅ Accurate findings based on trained AI
- ✅ No internet required (runs locally)
- ✅ Full control and privacy

### Requirements:
- Python 3.8+
- 8GB+ RAM (16GB recommended)
- GPU with 6GB+ VRAM (optional but recommended)
- 10GB disk space for models

### Setup Steps:

#### Step 1: Install PyTorch
```bash
# With CUDA (GPU - Recommended)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Without CUDA (CPU only)
pip install torch torchvision
```

#### Step 2: Install Transformers
```bash
pip install transformers huggingface-hub timm
```

#### Step 3: Download Models
```bash
# In Python
from transformers import AutoModel, AutoProcessor

# Download BiomedCLIP (for classification)
model = AutoModel.from_pretrained("microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224")

# Download LLaVA-Med (for report generation)
# model = AutoModel.from_pretrained("microsoft/llava-med-v1.5-mistral-7b")
```

#### Step 4: Configure Environment
```bash
# In ai-services/.env or system environment
AI_MODE=real
```

#### Step 5: Restart Services
```bash
cd ai-services
python medsigclip_server.py  # Port 5001
python medgemma_server.py     # Port 5002
```

### Expected Output:
```
🚀 Starting MedSigLIP Server
   Mode: REAL
   Device: cuda
   Port: 5001
   PyTorch: Available
📥 Loading MedSigLIP model from Hugging Face...
✅ Real AI model loaded successfully!
```

---

## ☁️ OPTION 2: Cloud API Mode (Easiest Setup)

### What You Get:
- ✅ Professional-grade medical AI
- ✅ No local GPU needed
- ✅ Always up-to-date models
- ✅ Scalable and reliable
- ❌ Requires internet
- ❌ Pay-per-use costs
- ❌ Data leaves your server

### Supported Providers:

#### A. Google Cloud Healthcare API

**Setup:**
```bash
# Install SDK
pip install google-cloud-healthcare google-cloud-vision

# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"

# Configure
export AI_MODE=cloud
export CLOUD_PROVIDER=google
export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_LOCATION=us-central1
```

**Get Credentials:**
1. Go to https://console.cloud.google.com
2. Create project
3. Enable Healthcare API
4. Create service account
5. Download JSON key

**Cost:** ~$0.01-0.05 per image

---

#### B. AWS HealthLake / Rekognition Medical

**Setup:**
```bash
# Install SDK
pip install boto3

# Configure AWS credentials
aws configure

# Set environment
export AI_MODE=cloud
export CLOUD_PROVIDER=aws
export AWS_REGION=us-east-1
```

**Get Credentials:**
1. Go to https://console.aws.amazon.com
2. Create IAM user
3. Attach HealthLake/Rekognition policies
4. Get access key and secret

**Cost:** ~$0.02-0.10 per image

---

#### C. Azure Health Bot / Computer Vision

**Setup:**
```bash
# Install SDK
pip install azure-ai-vision azure-health-bot

# Configure
export AI_MODE=cloud
export CLOUD_PROVIDER=azure
export AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
export AZURE_KEY=your-key
```

**Get Credentials:**
1. Go to https://portal.azure.com
2. Create Cognitive Services resource
3. Get endpoint and key

**Cost:** ~$0.01-0.08 per image

---

## 🎨 OPTION 3: Enhanced Demo Mode (Current - For Testing)

### What You Get:
- ✅ Works immediately (no setup)
- ✅ Realistic-looking results
- ✅ Good for UI/UX testing
- ✅ No costs
- ❌ NOT real medical AI
- ❌ Results based on image features only
- ❌ NOT for clinical use

### How It Works:
```
Image → Analyze Features → Generate Findings
        (brightness,
         contrast,
         edges,
         texture)
```

### Current Configuration:
```bash
AI_MODE=demo  # Default
```

### What's Analyzed:
- ✅ Image brightness
- ✅ Contrast levels
- ✅ Edge density
- ✅ Texture complexity
- ✅ Histogram distribution
- ❌ NOT actual pathology detection

### Improvements Made:
- Uses 5+ image features (was 1)
- Deterministic results (same image = same result)
- Realistic confidence scores
- Varied findings based on actual image content

---

## 🔄 Switching Between Modes

### To Real AI:
```bash
export AI_MODE=real
# Restart services
```

### To Cloud:
```bash
export AI_MODE=cloud
export CLOUD_PROVIDER=google  # or aws, azure
# Restart services
```

### To Demo:
```bash
export AI_MODE=demo
# Restart services
```

---

## 📋 Comparison Table

| Feature | Real AI | Cloud API | Enhanced Demo |
|---------|---------|-----------|---------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Setup Difficulty** | Hard | Easy | None |
| **Cost** | Hardware | Per-use | Free |
| **Internet Required** | No | Yes | No |
| **Privacy** | Full | Limited | Full |
| **Speed** | Fast | Medium | Very Fast |
| **Clinical Use** | ✅ Yes | ✅ Yes | ❌ NO |

---

## 🎯 Recommended Path

### For Development/Testing:
```
Start: Enhanced Demo Mode (current)
  ↓
Test: UI, workflows, features
  ↓
Ready: Switch to Real AI or Cloud
```

### For Production:
```
Option A: Real AI Mode
- Best for: Hospitals, clinics with IT infrastructure
- Requires: GPU server, technical setup
- Benefits: Full control, privacy, no ongoing costs

Option B: Cloud API Mode
- Best for: Startups, small clinics
- Requires: Cloud account, credit card
- Benefits: Easy setup, professional quality, scalable
```

---

## 🔧 Installation Commands

### Quick Install (Enhanced Demo - Current):
```bash
cd ai-services
pip install flask flask-cors pillow numpy scikit-image
python medsigclip_server.py
python medgemma_server.py
```

### Full Install (Real AI):
```bash
cd ai-services
pip install flask flask-cors pillow numpy scikit-image
pip install torch torchvision transformers huggingface-hub timm
python medsigclip_server.py
python medgemma_server.py
```

### Cloud Install (Google):
```bash
cd ai-services
pip install flask flask-cors pillow numpy
pip install google-cloud-healthcare google-cloud-vision
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
export AI_MODE=cloud
export CLOUD_PROVIDER=google
python medsigclip_server.py
python medgemma_server.py
```

---

## ✅ Verification

### Check Current Mode:
```bash
curl http://localhost:5001/health
```

**Response:**
```json
{
  "status": "healthy",
  "mode": "demo",  // or "real" or "cloud"
  "model": "MedSigLIP (demo mode)",
  "model_status": "not loaded",  // or "loaded"
  "torch_available": false,  // or true
  "cloud_available": false   // or true
}
```

---

## ⚠️ Important Warnings

### Enhanced Demo Mode:
```
⚠️  NOT FOR CLINICAL USE
⚠️  Results are simulated
⚠️  Based on image features only
⚠️  NOT real medical AI
⚠️  For testing purposes only
```

### Real AI Mode:
```
✅ Can be used clinically (with proper validation)
✅ Real medical image analysis
✅ Requires radiologist review
✅ Subject to regulatory requirements
```

### Cloud API Mode:
```
✅ Professional-grade AI
✅ Can be used clinically (check provider terms)
⚠️ Data sent to cloud provider
⚠️ Requires internet connection
⚠️ Ongoing costs
```

---

## 📞 Next Steps

1. **Keep Testing** - Current enhanced demo mode is great for development
2. **Plan Production** - Decide: Real AI or Cloud?
3. **Get Resources** - GPU server or cloud account
4. **Follow Setup** - Use guides above
5. **Validate** - Test thoroughly before clinical use

---

## 🆘 Troubleshooting

### "PyTorch not available"
```bash
pip install torch torchvision
```

### "Model failed to load"
```bash
# Check internet connection
# Check disk space (need 10GB+)
# Try: huggingface-cli login
```

### "Cloud API failed"
```bash
# Check credentials
# Check internet
# Check API is enabled in cloud console
# Check billing is enabled
```

### "Demo mode but want real AI"
```bash
export AI_MODE=real
# Restart services
```

---

**Current Status:** ✅ Enhanced Demo Mode Active
**Next Step:** Choose Real AI or Cloud API for production

---

**Questions?** Check the mode-specific guides or contact support.
