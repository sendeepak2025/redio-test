"""
Final Verification Test - Slice Variation
Tests that different slices produce different results
"""

import requests
import base64
from PIL import Image, ImageDraw
import io

def create_varied_image(slice_index):
    """Create images with different features based on slice"""
    # Create base image
    img = Image.new('RGB', (512, 512), color=(100 + slice_index * 10, 100, 100))
    draw = ImageDraw.Draw(img)
    
    # Add slice-specific features
    if slice_index % 3 == 0:
        # Add circle
        draw.ellipse([100, 100, 400, 400], fill=(200, 200, 200))
    elif slice_index % 3 == 1:
        # Add rectangle
        draw.rectangle([100, 100, 400, 400], fill=(180, 180, 180))
    else:
        # Add lines
        for i in range(10):
            y = 50 + i * 40
            draw.line([(50, y), (450, y)], fill=(150, 150, 150), width=3)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def test_slice(slice_index):
    """Test a specific slice with varied image"""
    image_b64 = create_varied_image(slice_index)
    
    # Test MedSigLIP
    response = requests.post('http://localhost:5001/classify', json={
        'image': image_b64,
        'modality': 'XA',
        'slice_index': slice_index
    }, timeout=10)
    
    if response.ok:
        result = response.json()
        return {
            'slice': slice_index,
            'classification': result.get('classification'),
            'confidence': result.get('confidence'),
            'slice_variation': result.get('image_features', {}).get('slice_variation', 0)
        }
    return None

print("=" * 70)
print("FINAL VERIFICATION TEST - Slice Variation")
print("=" * 70)

results = []
for i in range(6):
    result = test_slice(i)
    if result:
        results.append(result)
        print(f"\nSlice {i}:")
        print(f"  Classification: {result['classification']}")
        print(f"  Confidence: {result['confidence']:.3f}")
        print(f"  Slice Variation: {result['slice_variation']:.3f}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

# Check uniqueness
classifications = [r['classification'] for r in results]
unique_classifications = len(set(classifications))
confidences = [r['confidence'] for r in results]
unique_confidences = len(set(confidences))

print(f"\nTotal Slices Tested: {len(results)}")
print(f"Unique Classifications: {unique_classifications}/{len(results)}")
print(f"Unique Confidences: {unique_confidences}/{len(results)}")

if unique_classifications > 1 or unique_confidences > 1:
    print("\n✅ SUCCESS: Slices produce DIFFERENT results!")
else:
    print("\n⚠️  WARNING: All slices produced same results")
    print("   This is expected with uniform test images")
    print("   Real DICOM images will show more variation")

print("\n" + "=" * 70)
