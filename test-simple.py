import requests
import base64
from PIL import Image
import io

# Create test image
img = Image.new('RGB', (512, 512), color='gray')
buffer = io.BytesIO()
img.save(buffer, format='PNG')
image_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

# Test slice 0
print("Testing slice 0...")
response = requests.post('http://localhost:5001/classify', json={
    'image': image_b64,
    'modality': 'XA',
    'slice_index': 0
})
print(f"Response: {response.json()}")

# Test slice 3
print("\nTesting slice 3...")
response = requests.post('http://localhost:5001/classify', json={
    'image': image_b64,
    'modality': 'XA',
    'slice_index': 3
})
print(f"Response: {response.json()}")
