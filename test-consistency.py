"""Test classification and report consistency"""
import requests
import base64
from PIL import Image
import io

# Create test image
img = Image.new('RGB', (512, 512), color='gray')
buffer = io.BytesIO()
img.save(buffer, format='PNG')
image_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

print("=" * 70)
print("TESTING CLASSIFICATION & REPORT CONSISTENCY")
print("=" * 70)

# Test MedSigLIP
print("\n1. MedSigLIP Classification:")
response = requests.post('http://localhost:5001/classify', json={
    'image': image_b64,
    'modality': 'XA',
    'slice_index': 0
})

if response.ok:
    result = response.json()
    classification = result.get('classification')
    confidence = result.get('confidence')
    top_preds = result.get('top_predictions', [])
    
    print(f"   Classification: {classification}")
    print(f"   Confidence: {confidence:.3f}")
    print(f"   Top Predictions:")
    for pred in top_preds[:5]:
        print(f"      - {pred['label']}: {pred['confidence']:.3f}")
    
    # Test MedGemma with classification
    print("\n2. MedGemma Report (with classification):")
    response2 = requests.post('http://localhost:5002/generate-report', json={
        'image': image_b64,
        'modality': 'XA',
        'slice_index': 0,
        'classification': classification,
        'patientContext': {
            'age': 'Unknown',
            'sex': 'Unknown',
            'clinicalHistory': 'Slice 0 analysis'
        }
    })
    
    if response2.ok:
        report = response2.json()
        findings = report.get('findings', '')
        impression = report.get('impression', '')
        
        print(f"   Findings (first 200 chars):")
        print(f"      {findings[:200]}...")
        print(f"   Impression:")
        print(f"      {impression}")
        
        # Check consistency
        print("\n3. Consistency Check:")
        if classification.lower() in findings.lower() or classification.lower() in impression.lower():
            print(f"   ✅ CONSISTENT: '{classification}' found in report")
        else:
            print(f"   ❌ INCONSISTENT: '{classification}' NOT found in report")
            print(f"      Classification: {classification}")
            print(f"      Report mentions: {findings[100:200]}")
    else:
        print(f"   ❌ MedGemma failed: {response2.status_code}")
else:
    print(f"   ❌ MedSigLIP failed: {response.status_code}")

print("\n" + "=" * 70)
