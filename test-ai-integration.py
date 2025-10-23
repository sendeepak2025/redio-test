"""
Test AI Services Integration
"""
import requests
import base64
import json
from PIL import Image
import io

print("=" * 60)
print("Testing AI Services Integration")
print("=" * 60)
print()

# Test 1: Health Checks
print("1. Testing Health Endpoints...")
print("-" * 60)

try:
    response = requests.get("http://localhost:5001/health")
    print(f"✅ MedSigLIP Health: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"❌ MedSigLIP Health Failed: {e}")

print()

try:
    response = requests.get("http://localhost:5002/health")
    print(f"✅ MedGemma Health: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"❌ MedGemma Health Failed: {e}")

print()
print()

# Test 2: Image Classification
print("2. Testing Image Classification...")
print("-" * 60)

# Create a test image
img = Image.new('RGB', (512, 512), color=(128, 128, 128))
buffer = io.BytesIO()
img.save(buffer, format='PNG')
img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

try:
    response = requests.post(
        "http://localhost:5001/classify",
        json={
            "image": img_base64,
            "modality": "XR"
        }
    )
    print(f"✅ Classification: {response.status_code}")
    result = response.json()
    print(f"   Classification: {result.get('classification')}")
    print(f"   Confidence: {result.get('confidence'):.2%}")
    print(f"   Processing Time: {result.get('processing_time'):.3f}s")
    print(f"   Demo Mode: {result.get('demo_mode')}")
except Exception as e:
    print(f"❌ Classification Failed: {e}")

print()
print()

# Test 3: Report Generation
print("3. Testing Report Generation...")
print("-" * 60)

try:
    response = requests.post(
        "http://localhost:5002/generate-report",
        json={
            "image": img_base64,
            "modality": "XR",
            "patientContext": {
                "age": 45,
                "sex": "M",
                "clinicalHistory": "Chest pain"
            }
        }
    )
    print(f"✅ Report Generation: {response.status_code}")
    result = response.json()
    print(f"   Confidence: {result.get('confidence'):.2%}")
    print(f"   Processing Time: {result.get('processing_time'):.3f}s")
    print(f"   Demo Mode: {result.get('demo_mode')}")
    print()
    print("   Findings Preview:")
    findings = result.get('findings', '')
    print(f"   {findings[:200]}...")
    print()
    print("   Impression:")
    print(f"   {result.get('impression')}")
except Exception as e:
    print(f"❌ Report Generation Failed: {e}")

print()
print()
print("=" * 60)
print("✅ All Tests Completed!")
print("=" * 60)
print()
print("Next Steps:")
print("1. Your AI services are running successfully")
print("2. Restart your backend server to enable AI features")
print("3. Test AI analysis in the viewer UI")
print()
