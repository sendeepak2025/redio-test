#!/usr/bin/env python3
"""
Test slice variation in AI services
Tests if different slices produce different results
"""

import requests
import base64
import json
from PIL import Image
import io

# Create a simple test image
def create_test_image():
    img = Image.new('RGB', (512, 512), color='gray')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def test_slice(slice_index):
    """Test a specific slice"""
    print(f"\n{'='*70}")
    print(f"🧪 TESTING SLICE {slice_index}")
    print(f"{'='*70}")
    
    image_b64 = create_test_image()
    
    # Test MedSigLIP
    print(f"\n📊 Testing MedSigLIP (port 5001)...")
    try:
        response = requests.post('http://localhost:5001/classify', json={
            'image': image_b64,
            'modality': 'XA',
            'slice_index': slice_index
        }, timeout=10)
        
        if response.ok:
            result = response.json()
            print(f"✅ MedSigLIP Response:")
            print(f"   Classification: {result.get('classification')}")
            print(f"   Confidence: {result.get('confidence'):.3f}")
            print(f"   Slice Index: {result.get('slice_index')}")
            print(f"   Demo Mode: {result.get('demo_mode')}")
        else:
            print(f"❌ MedSigLIP failed: {response.status_code}")
    except Exception as e:
        print(f"❌ MedSigLIP error: {e}")
    
    # Test MedGemma
    print(f"\n📝 Testing MedGemma (port 5002)...")
    try:
        response = requests.post('http://localhost:5002/generate-report', json={
            'image': image_b64,
            'modality': 'XA',
            'slice_index': slice_index,
            'patientContext': {
                'age': 'Unknown',
                'sex': 'Unknown',
                'clinicalHistory': f'Slice {slice_index} analysis'
            }
        }, timeout=10)
        
        if response.ok:
            result = response.json()
            print(f"✅ MedGemma Response:")
            print(f"   Findings: {result.get('findings')[:100]}...")
            print(f"   Impression: {result.get('impression')[:100]}...")
            print(f"   Slice Index: {result.get('slice_index')}")
            print(f"   Confidence: {result.get('confidence'):.3f}")
            print(f"   Demo Mode: {result.get('demo_mode')}")
        else:
            print(f"❌ MedGemma failed: {response.status_code}")
    except Exception as e:
        print(f"❌ MedGemma error: {e}")

def main():
    print("🚀 Starting Slice Variation Test")
    print("=" * 70)
    
    # Test slices 0, 1, 2, 3, 4, 5
    test_slices = [0, 1, 2, 3, 4, 5]
    
    for slice_idx in test_slices:
        test_slice(slice_idx)
    
    print(f"\n{'='*70}")
    print("✅ Test Complete!")
    print("=" * 70)
    print("\n📋 Check the output above:")
    print("   - Each slice should have DIFFERENT classification")
    print("   - Each slice should have DIFFERENT findings")
    print("   - Confidence values should vary")
    print("   - slice_index should match the requested slice")

if __name__ == '__main__':
    main()
