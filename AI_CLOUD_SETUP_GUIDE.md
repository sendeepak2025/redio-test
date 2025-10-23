# 🚀 MedSigLIP + MedGemma Cloud Setup Guide

## Complete Guide to Deploy Medical AI Models in the Cloud

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Cloud Provider Options](#cloud-provider-options)
3. [Hardware Requirements](#hardware-requirements)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Docker Deployment](#docker-deployment)
6. [Manual Installation](#manual-installation)
7. [Configuration](#configuration)
8. [Testing & Validation](#testing--validation)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What You're Setting Up

```
┌─────────────────────────────────────────────────────┐
│                  Your Application                    │
│              (Medical Imaging Platform)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │
┌──────────────────┴──────────────────────────────────┐
│              AI Services (Cloud VM)                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   MedSigLIP      │  │   MedGemma-4B    │        │
│  │   (Port 5001)    │  │   (Port 5002)    │        │
│  │                  │  │                  │        │
│  │  • Classification│  │  • Report Gen    │        │
│  │  • Feature Ext   │  │  • Reasoning     │        │
│  │  • Similarity    │  │  • Summarization │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                      │
│  Optional:                                           │
│  ┌──────────────────┐                               │
│  │  MedGemma-27B    │  (High-end only)              │
│  │  (Port 5003)     │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

---

## ☁️ Cloud Provider Options

### Option 1: AWS (Recommended for Production)

**Best For**: Enterprise deployments, scalability, compliance

**GPU Instances**:
- **g4dn.xlarge** (NVIDIA T4, 16GB VRAM) - $0.526/hour
  - ✅ Perfect for MedSigLIP + MedGemma-4B
  - Monthly: ~$380
  
- **g5.xlarge** (NVIDIA A10G, 24GB VRAM) - $1.006/hour
  - ✅ Better performance, can handle MedGemma-4B easily
  - Monthly: ~$730
  
- **p3.2xlarge** (NVIDIA V100, 16GB VRAM) - $3.06/hour
  - ✅ High performance for production
  - Monthly: ~$2,200

**Setup Steps**: See [AWS Setup](#aws-setup) below

---

### Option 2: Google Cloud Platform (GCP)

**Best For**: AI/ML workloads, good GPU availability

**GPU Instances**:
- **n1-standard-4 + T4** - $0.35/hour (compute) + $0.35/hour (GPU)
  - Total: $0.70/hour (~$500/month)
  - ✅ Good for MedSigLIP + MedGemma-4B
  
- **n1-standard-8 + V100** - $0.38/hour (compute) + $2.48/hour (GPU)
  - Total: $2.86/hour (~$2,100/month)
  - ✅ High performance

**Setup Steps**: See [GCP Setup](#gcp-setup) below

---

### Option 3: Azure

**Best For**: Microsoft ecosystem integration, HIPAA compliance

**GPU Instances**:
- **NC6s_v3** (NVIDIA V100, 16GB VRAM) - $3.06/hour
  - Monthly: ~$2,200
  - ✅ Good for production
  
- **NC4as_T4_v3** (NVIDIA T4, 16GB VRAM) - $0.526/hour
  - Monthly: ~$380
  - ✅ Cost-effective option

**Setup Steps**: See [Azure Setup](#azure-setup) below

---

### Option 4: Vast.ai / RunPod (Budget Option)

**Best For**: Development, testing, cost-sensitive deployments

**Pricing**:
- **RTX 3090** (24GB VRAM) - $0.20-0.40/hour (~$150-300/month)
- **RTX 4090** (24GB VRAM) - $0.30-0.50/hour (~$220-370/month)
- **A100** (40GB VRAM) - $0.80-1.50/hour (~$580-1,100/month)

**Pros**: Very cheap, flexible
**Cons**: Less reliable, no SLA, community-hosted

---

## 💻 Hardware Requirements

### Minimum Configuration (Development/Testing)

```yaml
MedSigLIP Only:
  CPU: 4 cores
  RAM: 8GB
  GPU: 4GB VRAM (GTX 1650, T4)
  Storage: 20GB SSD
  Cost: ~$100-150/month

MedSigLIP + MedGemma-4B:
  CPU: 8 cores
  RAM: 16GB
  GPU: 16GB VRAM (T4, RTX 4000)
  Storage: 50GB SSD
  Cost: ~$380-500/month
```

### Recommended Configuration (Production)

```yaml
MedSigLIP + MedGemma-4B:
  CPU: 16 cores
  RAM: 32GB
  GPU: 24GB VRAM (A10G, RTX 3090)
  Storage: 100GB SSD
  Cost: ~$730-1,000/month
```

### Advanced Configuration (High-Volume)

```yaml
MedSigLIP + MedGemma-4B + MedGemma-27B:
  CPU: 32 cores
  RAM: 64GB
  GPU: 48GB VRAM (A100 80GB or 2x A10G)
  Storage: 200GB SSD
  Cost: ~$2,000-3,000/month
```

---

## 🚀 Step-by-Step Setup

### AWS Setup

#### 1. Launch EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Deep Learning AMI (Ubuntu)
  --instance-type g4dn.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MedicalAI-Server}]'
```

**Or via AWS Console**:
1. Go to EC2 → Launch Instance
2. Choose: **Deep Learning AMI (Ubuntu 20.04)**
3. Instance Type: **g4dn.xlarge** (or larger)
4. Storage: **100GB gp3**
5. Security Group: Open ports 5001, 5002, 5003, 22

#### 2. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@<instance-public-ip>
```

#### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install NVIDIA Docker
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Verify GPU
nvidia-smi
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu20.04 nvidia-smi
```

#### 4. Deploy AI Services

```bash
# Clone your repository (or create docker-compose file)
git clone https://github.com/your-repo/medical-ai-services.git
cd medical-ai-services

# Create docker-compose.yml (see below)
nano docker-compose.yml

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

### GCP Setup

#### 1. Create VM with GPU

```bash
# Using gcloud CLI
gcloud compute instances create medical-ai-server \
  --zone=us-central1-a \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=100GB \
  --maintenance-policy=TERMINATE \
  --metadata="install-nvidia-driver=True"
```

**Or via GCP Console**:
1. Compute Engine → VM Instances → Create
2. Machine Type: **n1-standard-8**
3. GPUs: **1 x NVIDIA T4**
4. Boot Disk: **Deep Learning on Linux** (100GB)
5. Firewall: Allow HTTP/HTTPS

#### 2. Connect and Setup

```bash
gcloud compute ssh medical-ai-server --zone=us-central1-a

# Install Docker (if not pre-installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install NVIDIA Docker
# (Same as AWS steps above)
```

---

### Azure Setup

#### 1. Create VM

```bash
# Using Azure CLI
az vm create \
  --resource-group medical-ai-rg \
  --name medical-ai-server \
  --image microsoft-dsvm:ubuntu-2004:2004-gen2:latest \
  --size Standard_NC6s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Open ports
az vm open-port --resource-group medical-ai-rg --name medical-ai-server --port 5001-5003
```

#### 2. Connect and Setup

```bash
ssh azureuser@<vm-public-ip>

# Install Docker and NVIDIA Docker
# (Same as AWS steps above)
```

---

## 🐳 Docker Deployment

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  # MedSigLIP Service (Fast Classification)
  medsigclip:
    image: python:3.10-slim
    container_name: medsigclip-service
    ports:
      - "5001:5001"
    volumes:
      - ./ai-services:/app
      - ./models:/models
    working_dir: /app
    command: python medsigclip-server.py
    environment:
      - MODEL_PATH=/models/medsigclip
      - PORT=5001
      - DEVICE=cuda
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MedGemma-4B Service (Report Generation)
  medgemma-4b:
    image: python:3.10-slim
    container_name: medgemma-4b-service
    ports:
      - "5002:5002"
    volumes:
      - ./ai-services:/app
      - ./models:/models
    working_dir: /app
    command: python medgemma-4b-server.py
    environment:
      - MODEL_PATH=/models/medgemma-4b
      - PORT=5002
      - DEVICE=cuda
      - MAX_LENGTH=512
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MedGemma-27B Service (Optional - Advanced Reasoning)
  medgemma-27b:
    image: python:3.10-slim
    container_name: medgemma-27b-service
    ports:
      - "5003:5003"
    volumes:
      - ./ai-services:/app
      - ./models:/models
    working_dir: /app
    command: python medgemma-27b-server.py
    environment:
      - MODEL_PATH=/models/medgemma-27b
      - PORT=5003
      - DEVICE=cuda
      - LOAD_IN_8BIT=true  # Quantization for memory efficiency
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    profiles:
      - advanced  # Only start with --profile advanced
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy (Optional - for load balancing)
  nginx:
    image: nginx:alpine
    container_name: ai-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - medsigclip
      - medgemma-4b
    restart: unless-stopped

volumes:
  models:
    driver: local
```

### Create AI Service Scripts

#### `ai-services/medsigclip-server.py`

```python
#!/usr/bin/env python3
"""
MedSigLIP Server
Fast medical image classification and feature extraction
"""

from flask import Flask, request, jsonify
from transformers import AutoModel, AutoProcessor
from PIL import Image
import torch
import io
import base64
import time
import os

app = Flask(__name__)

# Configuration
MODEL_PATH = os.getenv('MODEL_PATH', '/models/medsigclip')
PORT = int(os.getenv('PORT', 5001))
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Load model
print(f"Loading MedSigLIP model from {MODEL_PATH}...")
model = AutoModel.from_pretrained(MODEL_PATH, trust_remote_code=True)
processor = AutoProcessor.from_pretrained(MODEL_PATH, trust_remote_code=True)
model.to(DEVICE)
model.eval()
print(f"Model loaded on {DEVICE}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'MedSigLIP-0.4B',
        'device': DEVICE,
        'gpu_available': torch.cuda.is_available()
    })

@app.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.json
        image_b64 = data.get('image')
        modality = data.get('modality', 'unknown')
        
        # Decode image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Process
        start_time = time.time()
        inputs = processor(images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            outputs = model(**inputs)
            features = outputs.image_embeds.cpu().numpy().tolist()[0]
            
            # Classification (example labels)
            labels = ['normal', 'abnormal', 'fracture', 'pneumonia', 'mass']
            logits = outputs.logits_per_image[0]
            probs = torch.softmax(logits, dim=0).cpu().numpy()
            
            top_idx = probs.argmax()
            classification = labels[top_idx]
            confidence = float(probs[top_idx])
        
        processing_time = time.time() - start_time
        
        return jsonify({
            'classification': classification,
            'confidence': confidence,
            'features': features,
            'processing_time': processing_time,
            'modality': modality
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
```

#### `ai-services/medgemma-4b-server.py`

```python
#!/usr/bin/env python3
"""
MedGemma-4B Server
Radiology report generation and clinical reasoning
"""

from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image
import torch
import io
import base64
import time
import os

app = Flask(__name__)

# Configuration
MODEL_PATH = os.getenv('MODEL_PATH', '/models/medgemma-4b')
PORT = int(os.getenv('PORT', 5002))
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
MAX_LENGTH = int(os.getenv('MAX_LENGTH', 512))

# Load model
print(f"Loading MedGemma-4B model from {MODEL_PATH}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16 if DEVICE == 'cuda' else torch.float32,
    device_map='auto'
)
print(f"Model loaded on {DEVICE}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': 'MedGemma-4B',
        'device': DEVICE,
        'gpu_available': torch.cuda.is_available()
    })

@app.route('/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        image_b64 = data.get('image')
        modality = data.get('modality', 'unknown')
        patient_context = data.get('patientContext', {})
        
        # Decode image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Create prompt
        prompt = f"""Generate a radiology report for this {modality} image.

Patient Context:
- Age: {patient_context.get('age', 'unknown')}
- Sex: {patient_context.get('sex', 'unknown')}
- Clinical History: {patient_context.get('clinicalHistory', 'not provided')}

Report Format:
TECHNIQUE:
FINDINGS:
IMPRESSION:
"""
        
        # Generate
        start_time = time.time()
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=MAX_LENGTH,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
        
        report_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        processing_time = time.time() - start_time
        
        # Parse report sections
        sections = parse_report(report_text)
        
        return jsonify({
            'findings': sections.get('findings', ''),
            'impression': sections.get('impression', ''),
            'recommendations': sections.get('recommendations', []),
            'full_report': report_text,
            'processing_time': processing_time,
            'confidence': 0.85  # Placeholder
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def parse_report(text):
    """Parse report into sections"""
    sections = {}
    
    # Simple parsing (improve with regex)
    if 'FINDINGS:' in text:
        findings_start = text.index('FINDINGS:') + len('FINDINGS:')
        findings_end = text.index('IMPRESSION:') if 'IMPRESSION:' in text else len(text)
        sections['findings'] = text[findings_start:findings_end].strip()
    
    if 'IMPRESSION:' in text:
        impression_start = text.index('IMPRESSION:') + len('IMPRESSION:')
        sections['impression'] = text[impression_start:].strip()
    
    sections['recommendations'] = []
    
    return sections

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
```

### Download Models

```bash
# Create models directory
mkdir -p models

# Download MedSigLIP (example - adjust to actual model source)
cd models
git lfs install
git clone https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224 medsigclip

# Download MedGemma-4B
git clone https://huggingface.co/google/medgemma-4b medgemma-4b

cd ..
```

### Start Services

```bash
# Start basic services (MedSigLIP + MedGemma-4B)
docker-compose up -d

# Start all services including MedGemma-27B
docker-compose --profile advanced up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f medsigclip
docker-compose logs -f medgemma-4b

# Test health
curl http://localhost:5001/health
curl http://localhost:5002/health
```

---

## ⚙️ Configuration

### Update Your Application `.env`

```bash
# server/.env

# AI Service URLs (use your cloud VM IP)
MEDSIGCLIP_API_URL=http://<your-vm-ip>:5001
MEDSIGCLIP_ENABLED=true

MEDGEMMA_4B_API_URL=http://<your-vm-ip>:5002
MEDGEMMA_4B_ENABLED=true

MEDGEMMA_27B_API_URL=http://<your-vm-ip>:5003
MEDGEMMA_27B_ENABLED=false

# Timeouts
AI_REQUEST_TIMEOUT=30000
AI_CLASSIFICATION_TIMEOUT=10000
AI_REPORT_TIMEOUT=30000
```

### Security: Use HTTPS with Nginx

```nginx
# nginx.conf
upstream medsigclip {
    server medsigclip:5001;
}

upstream medgemma4b {
    server medgemma-4b:5002;
}

server {
    listen 443 ssl;
    server_name ai.yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location /medsigclip/ {
        proxy_pass http://medsigclip/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /medgemma/ {
        proxy_pass http://medgemma4b/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🧪 Testing & Validation

### Test MedSigLIP

```bash
# Create test image (base64)
base64 test-xray.jpg > test-image.b64

# Test classification
curl -X POST http://localhost:5001/classify \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$(cat test-image.b64)'",
    "modality": "XR"
  }'
```

### Test MedGemma-4B

```bash
curl -X POST http://localhost:5002/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "image": "'$(cat test-image.b64)'",
    "modality": "CT",
    "patientContext": {
      "age": 45,
      "sex": "M",
      "clinicalHistory": "Chest pain"
    }
  }'
```

### Test from Your Application

```bash
# Test full analysis
curl -X POST http://localhost:8000/api/medical-ai/analyze-study \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studyInstanceUID": "1.2.3.4.5",
    "frameIndex": 0
  }'
```

---

## 💰 Cost Optimization

### 1. Use Spot/Preemptible Instances

```bash
# AWS Spot Instance (up to 90% cheaper)
aws ec2 request-spot-instances \
  --spot-price "0.20" \
  --instance-count 1 \
  --type "one-time" \
  --launch-specification file://spot-spec.json

# GCP Preemptible VM (up to 80% cheaper)
gcloud compute instances create medical-ai-spot \
  --preemptible \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1
```

### 2. Auto-Scaling

```bash
# Only run AI services during business hours
# Add to crontab
0 8 * * 1-5 docker-compose up -d    # Start at 8 AM weekdays
0 18 * * 1-5 docker-compose down    # Stop at 6 PM weekdays
```

### 3. Model Quantization

```python
# Load model in 8-bit (uses 50% less memory)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    load_in_8bit=True,
    device_map='auto'
)
```

### 4. Batch Processing

```python
# Process multiple images in one request
@app.route('/classify-batch', methods=['POST'])
def classify_batch():
    images = request.json.get('images', [])
    # Process all at once
    results = model.process_batch(images)
    return jsonify(results)
```

---

## 🔧 Troubleshooting

### GPU Not Detected

```bash
# Check NVIDIA driver
nvidia-smi

# Reinstall NVIDIA Docker
sudo apt-get purge nvidia-docker2
sudo apt-get install nvidia-docker2
sudo systemctl restart docker

# Test GPU in Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu20.04 nvidia-smi
```

### Out of Memory

```bash
# Reduce batch size
export BATCH_SIZE=1

# Enable model quantization
export LOAD_IN_8BIT=true

# Use smaller model
# Switch from MedGemma-27B to MedGemma-4B
```

### Slow Inference

```bash
# Check GPU utilization
nvidia-smi -l 1

# Enable mixed precision
export USE_FP16=true

# Increase GPU memory
# Upgrade to larger instance type
```

### Connection Refused

```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs medsigclip

# Test locally first
curl http://localhost:5001/health

# Check firewall
sudo ufw status
sudo ufw allow 5001/tcp
```

---

## 📊 Monitoring

### Setup Prometheus + Grafana

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Monitor GPU Usage

```bash
# Install nvidia-smi exporter
docker run -d --gpus all \
  -p 9445:9445 \
  nvidia/dcgm-exporter:latest
```

---

## 🎯 Quick Start Commands

```bash
# 1. Launch cloud VM with GPU
# (Use AWS/GCP/Azure console or CLI)

# 2. Connect to VM
ssh user@<vm-ip>

# 3. Install Docker + NVIDIA Docker
curl -fsSL https://get.docker.com | sh
# (Install NVIDIA Docker - see above)

# 4. Clone and setup
git clone https://github.com/your-repo/medical-ai-services.git
cd medical-ai-services

# 5. Download models
./scripts/download-models.sh

# 6. Start services
docker-compose up -d

# 7. Test
curl http://localhost:5001/health
curl http://localhost:5002/health

# 8. Update your app config
# Set MEDSIGCLIP_API_URL=http://<vm-ip>:5001
# Set MEDGEMMA_4B_API_URL=http://<vm-ip>:5002

# 9. Restart your app
cd /path/to/your/app/server
npm restart
```

---

## 📚 Additional Resources

- [MedSigLIP Paper](https://arxiv.org/abs/...)
- [MedGemma Documentation](https://github.com/google-research/medgemma)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [NVIDIA Docker Setup](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

---

**Last Updated**: October 22, 2025
**Status**: Production Ready
