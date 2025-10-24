"""Test normal classification for XA modality"""
import requests
import base64
from PIL import Image
import io
import time

# Create test image
img = Image.new('RGB', (512, 512), color='gray')
buffer = io.BytesIO()
img.save(buffer, format='PNG')
image_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

time.sleep(3)  # Wait for servers to start

print("=" * 70)
print("TESTING NORMAL CLASSIFICATION FOR XA MODALITY")
print("=" * 70)

# Test with classification = "normal"
print("\nTest: Classification = 'normal', Modality = 'XA'")
print("-" * 70)

response = requests.post('http://localhost:5002/generate-report', json={
    'image': image_b64,
    'modality': 'XA',
    'slice_index': 1,
    'classification': 'normal',
    'patientContext': {
        'age': 'Unknown',
        'sex': 'Unknown',
        'clinicalHistory': 'Slice 1 analysis'
    }
}, timeout=10)

if response.ok:
    report = response.json()
    findings = report.get('findings', '')
    impression = report.get('impression', '')
    
    print("\nFindings:")
    print(findings)
    print("\nImpression:")
    print(impression)
    
    # Check for inappropriate lung findings
    lung_terms = ['lungs', 'pleural', 'pneumothorax', 'consolidation', 'effusion']
    has_lung_findings = any(term in findings.lower() for term in lung_terms)
    
    # Check for appropriate coronary findings
    coronary_terms = ['coronary', 'artery', 'arteries', 'cardiac', 'angiogram']
    has_coronary_findings = any(term in findings.lower() for term in coronary_terms)
    
    print("\n" + "=" * 70)
    print("VALIDATION:")
    print("=" * 70)
    
    if has_lung_findings:
        print("❌ FAIL: Lung findings detected in XA (angiography) report!")
        print("   Found terms:", [t for t in lung_terms if t in findings.lower()])
    else:
        print("✅ PASS: No inappropriate lung findings")
    
    if has_coronary_findings:
        print("✅ PASS: Appropriate coronary/cardiac findings present")
    else:
        print("⚠️  WARNING: No coronary findings detected")
    
    if not has_lung_findings and has_coronary_findings:
        print("\n🎉 SUCCESS: XA normal report is modality-appropriate!")
    else:
        print("\n❌ FAILED: Report needs correction")
else:
    print(f"❌ Request failed: {response.status_code}")

print("\n" + "=" * 70)
