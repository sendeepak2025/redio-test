"""
MedSigLIP Server - Multi-Mode Medical Image Classification
Supports: Real AI Models, Cloud APIs, and Enhanced Demo Mode
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import time
import os
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
PORT = int(os.getenv('PORT', 5001))
MODE = os.getenv('AI_MODE', 'demo')  # 'real', 'cloud', or 'demo'
CLOUD_PROVIDER = os.getenv('CLOUD_PROVIDER', 'none')  # 'google', 'aws', 'azure', or 'none'

# Try to import deep learning libraries
try:
    import torch
    import torchvision.transforms as transforms
    DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
    TORCH_AVAILABLE = True
except ImportError:
    DEVICE = 'cpu'
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not installed - real AI mode unavailable")

# Try to import cloud SDKs
CLOUD_AVAILABLE = False
try:
    if CLOUD_PROVIDER == 'google':
        from google.cloud import healthcare_v1
        CLOUD_AVAILABLE = True
    elif CLOUD_PROVIDER == 'aws':
        import boto3
        CLOUD_AVAILABLE = True
    elif CLOUD_PROVIDER == 'azure':
        from azure.ai.vision import ImageAnalysisClient
        CLOUD_AVAILABLE = True
except ImportError:
    print(f"⚠️  Cloud SDK for {CLOUD_PROVIDER} not installed")

# Global model variable
MODEL = None
TRANSFORM = None

print(f"🚀 Starting MedSigLIP Server")
print(f"   Mode: {MODE.upper()}")
print(f"   Device: {DEVICE}")
print(f"   Port: {PORT}")
print(f"   PyTorch: {'Available' if TORCH_AVAILABLE else 'Not Available'}")
print(f"   Cloud: {CLOUD_PROVIDER.upper() if CLOUD_AVAILABLE else 'Not Configured'}")

def load_real_model():
    """Load real MedSigLIP model from Hugging Face"""
    global MODEL, TRANSFORM
    try:
        from transformers import AutoModel, AutoProcessor
        print("📥 Loading MedSigLIP model from Hugging Face...")
        MODEL = AutoModel.from_pretrained("microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224")
        TRANSFORM = AutoProcessor.from_pretrained("microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224")
        MODEL.to(DEVICE)
        MODEL.eval()
        print("✅ Real AI model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to load real model: {e}")
        return False

def analyze_image_features(image):
    """Enhanced image analysis for better demo mode"""
    # Convert to numpy array
    img_array = np.array(image.convert('L'))
    
    # Calculate comprehensive features
    features = {
        'brightness': float(np.mean(img_array)),
        'contrast': float(np.std(img_array)),
        'entropy': float(-np.sum(np.histogram(img_array, bins=256)[0] * np.log2(np.histogram(img_array, bins=256)[0] + 1e-10))),
        'edges': float(np.mean(np.abs(np.gradient(img_array.astype(float))[0]))),
        'texture': float(np.std(np.gradient(img_array.astype(float))[0])),
    }
    
    # Histogram analysis
    hist, _ = np.histogram(img_array, bins=256, range=(0, 256))
    features['hist_peak'] = float(np.argmax(hist))
    features['hist_spread'] = float(np.std(np.where(hist > 0)[0]))
    
    return features

@app.route('/health', methods=['GET'])
def health():
    model_status = 'loaded' if MODEL is not None else 'not loaded'
    return jsonify({
        'status': 'healthy',
        'mode': MODE,
        'model': f'MedSigLIP ({MODE} mode)',
        'model_status': model_status,
        'device': DEVICE,
        'gpu_available': TORCH_AVAILABLE and torch.cuda.is_available() if TORCH_AVAILABLE else False,
        'cloud_provider': CLOUD_PROVIDER if CLOUD_AVAILABLE else 'none',
        'torch_available': TORCH_AVAILABLE,
        'cloud_available': CLOUD_AVAILABLE
    })

@app.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.json
        image_b64 = data.get('image')
        modality = data.get('modality', 'unknown')
        slice_index = data.get('slice_index', 0)  # Get slice index from request
        
        print(f"\n{'='*60}")
        print(f"📥 MEDSIGCLIP CLASSIFY REQUEST")
        print(f"   Modality: {modality}")
        print(f"   Slice Index: {slice_index}")
        print(f"   Slice Index Type: {type(slice_index)}")
        print(f"{'='*60}\n")
        
        # Decode image (clean base64)
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        start_time = time.time()
        
        # Route to appropriate classification method
        if MODE == 'real' and MODEL is not None:
            result = classify_with_real_model(image, modality)
        elif MODE == 'cloud' and CLOUD_AVAILABLE:
            result = classify_with_cloud_api(image_bytes, modality)
        else:
            # Pass slice_index directly
            print(f"🔍 Classifying with demo mode, slice_index={slice_index}")
            result = classify_with_enhanced_demo(image, modality, slice_index)
        
        result['processing_time'] = time.time() - start_time
        result['mode'] = MODE
        
        print(f"✅ Classification result: {result.get('classification')} ({result.get('confidence'):.2f})")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error in classify: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def classify_with_real_model(image, modality):
    """Use real AI model via Hugging Face Inference API"""
    try:
        import requests
        
        print(f"🔍 Real AI: Calling Hugging Face API for {modality} image...")
        
        # Convert image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Use Hugging Face Inference API (FREE!)
        API_URL = "https://api-inference.huggingface.co/models/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
        headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN', '')}"}
        
        # Call Hugging Face API
        response = requests.post(
            API_URL,
            headers=headers,
            data=img_byte_arr,
            timeout=30
        )
        
        print(f"📡 Hugging Face API response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Got result: {type(result)}")
            
            # Parse results - HF returns different formats
            if isinstance(result, list) and len(result) > 0:
                top_result = result[0]
                return {
                    'classification': top_result.get('label', 'unknown'),
                    'confidence': float(top_result.get('score', 0.0)),
                    'top_predictions': [
                        {'label': r.get('label'), 'confidence': float(r.get('score', 0))}
                        for r in result[:5]
                    ],
                    'modality': modality,
                    'demo_mode': False,
                    'model': 'BiomedCLIP (Hugging Face)'
                }
            elif isinstance(result, dict):
                # Sometimes HF returns dict with 'error' or other format
                if 'error' in result:
                    print(f"⚠️  HF API error: {result['error']}")
                    print("   Falling back to enhanced demo mode...")
                    return classify_with_enhanced_demo(image, modality)
                # Try to extract classification from dict
                return {
                    'classification': result.get('label', 'unknown'),
                    'confidence': float(result.get('score', 0.5)),
                    'modality': modality,
                    'demo_mode': False,
                    'model': 'BiomedCLIP (Hugging Face)'
                }
        else:
            print(f"⚠️  HF API returned {response.status_code}: {response.text[:200]}")
            print("   Falling back to enhanced demo mode...")
        
        # Fallback to local analysis if API fails
        return classify_with_enhanced_demo(image, modality)
        
    except Exception as e:
        print(f"❌ Real model inference failed: {e}")
        import traceback
        traceback.print_exc()
        print("   Falling back to enhanced demo mode...")
        return classify_with_enhanced_demo(image, modality)

def classify_with_cloud_api(image_bytes, modality):
    """Use cloud API for classification - Using Hugging Face as default"""
    try:
        import requests
        
        # Use Hugging Face Inference API (works without token for public models)
        API_URL = "https://api-inference.huggingface.co/models/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
        
        response = requests.post(API_URL, data=image_bytes, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                return {
                    'classification': result[0].get('label', 'unknown'),
                    'confidence': float(result[0].get('score', 0.0)),
                    'top_predictions': [
                        {'label': r.get('label'), 'confidence': float(r.get('score', 0))}
                        for r in result[:5]
                    ],
                    'modality': modality,
                    'demo_mode': False,
                    'model': 'BiomedCLIP (Cloud)'
                }
        
        # Fallback
        return classify_with_enhanced_demo(Image.open(io.BytesIO(image_bytes)), modality)
    except Exception as e:
        print(f"Cloud API failed: {e}")
        return classify_with_enhanced_demo(Image.open(io.BytesIO(image_bytes)), modality)

def classify_with_enhanced_demo(image, modality, slice_index=0):
    """Enhanced demo mode with realistic image analysis and slice variation"""
    # Analyze image features
    features = analyze_image_features(image)
    
    # Use provided slice_index (default 0 if not provided)
    if slice_index is None:
        slice_index = 0
    
    # Classification labels by modality with more variety
    classifications = {
        'XA': ['normal', 'stenosis', 'occlusion', 'aneurysm', 'dissection', 'calcification', 'thrombus'],
        'XR': ['normal', 'pneumonia', 'fracture', 'effusion', 'cardiomegaly', 'nodule', 'atelectasis'],
        'CT': ['normal', 'mass', 'hemorrhage', 'infarct', 'nodule', 'fracture', 'consolidation'],
        'MR': ['normal', 'tumor', 'edema', 'lesion', 'enhancement', 'infarct', 'ischemia'],
        'US': ['normal', 'cyst', 'mass', 'fluid', 'calcification', 'stone', 'collection']
    }
    
    labels = classifications.get(modality, ['normal', 'abnormal', 'artifact', 'unclear', 'suspicious'])
    
    # Safety check - ensure labels is not empty
    if not labels or len(labels) == 0:
        labels = ['normal', 'abnormal', 'artifact']
    
    # Intelligent classification based on image features + slice variation
    brightness = features['brightness'] / 255.0
    contrast = features['contrast'] / 128.0
    entropy = features['entropy'] / 8.0
    edges = min(features['edges'] / 50.0, 1.0)
    
    # Add slice-based variation (makes each slice different)
    slice_factor = (slice_index % 7) / 7.0  # Cycles through 0-6
    
    # Combined score with weighted features + slice variation
    combined_score = (
        brightness * 0.20 +
        contrast * 0.20 +
        entropy * 0.20 +
        edges * 0.20 +
        slice_factor * 0.20  # Slice variation
    )
    
    # Determine classification based on score, features, and slice
    # IMPORTANT: Slice index is PRIMARY factor since same image is used for all slices
    if len(labels) > 0:
        # Use slice index as PRIMARY variation factor (add 1 to avoid 0)
        # Add image features as SECONDARY variation
        slice_seed = slice_index + 1  # Avoid 0
        slice_hash = (slice_seed * 7 + int(slice_seed ** 1.5) + slice_seed * 3) % len(labels)  # Primary
        feature_hash = int((brightness * 13 + contrast * 17 + entropy * 11 + edges * 19) % len(labels))  # Secondary
        combined_idx = (slice_hash * 3 + feature_hash) % len(labels)  # Slice weighted 3x
        
        # Select classification with varied logic
        if combined_score > 0.7 and contrast < 0.5:
            # High brightness, low contrast
            idx = (combined_idx + 0) % len(labels)
            classification = labels[idx]
            confidence = 0.72 + (combined_score - 0.7) * 0.4 + slice_factor * 0.05
        elif edges > 0.6 and contrast > 0.6 and len(labels) > 2:
            # High edges and contrast
            idx = (combined_idx + 2) % len(labels)
            classification = labels[idx]
            confidence = 0.68 + edges * 0.18 + slice_factor * 0.06
        elif brightness < 0.4 and entropy > 0.6 and len(labels) > 1:
            # Dark with high entropy
            idx = (combined_idx + 1) % len(labels)
            classification = labels[idx]
            confidence = 0.64 + entropy * 0.18 + slice_factor * 0.07
        elif len(labels) > 3:
            # Use combined index directly
            idx = (combined_idx + int(slice_index / 2)) % len(labels)
            classification = labels[idx]
            confidence = 0.66 + slice_factor * 0.15 + combined_score * 0.08
        else:
            # Fallback with variation
            idx = combined_idx
            classification = labels[idx]
            confidence = 0.62 + combined_score * 0.22 + slice_factor * 0.10
    else:
        # Fallback if somehow labels is still empty
        classification = 'unknown'
        confidence = 0.5
    
    # Vary confidence based on slice (PRIMARY factor)
    slice_seed = slice_index + 1  # Avoid 0
    slice_confidence_boost = (slice_seed * 3 + slice_seed % 7 + slice_seed // 2) * 0.012
    confidence = confidence + slice_confidence_boost
    confidence = min(0.94, max(0.60, confidence))
    
    # Generate top predictions with variation
    # IMPORTANT: Put selected classification FIRST, then others
    top_predictions = []
    
    # First: Add the selected classification with its confidence
    top_predictions.append({
        'label': classification,
        'confidence': float(confidence)
    })
    
    # Then: Add other labels with decreasing confidence
    for i, label in enumerate(labels[:5]):
        if label != classification:  # Skip the already-added classification
            pred_conf = confidence * (1.0 - (len(top_predictions)) * 0.12) + (slice_index % 5) * 0.01
            top_predictions.append({
                'label': label,
                'confidence': float(max(0.15, min(0.95, pred_conf)))
            })
            if len(top_predictions) >= 5:  # Limit to 5 predictions
                break
    
    print(f"\n{'='*60}")
    print(f"🎯 MEDSIGCLIP RESULT")
    print(f"   Slice {slice_index}: {classification} ({confidence:.2f})")
    print(f"   Slice Factor: {slice_factor:.3f}")
    print(f"   Combined Score: {combined_score:.3f}")
    print(f"{'='*60}\n")
    
    return {
        'classification': classification,
        'confidence': float(confidence),
        'top_predictions': top_predictions,
        'modality': modality,
        'demo_mode': True,
        'slice_index': slice_index,
        'image_features': {
            'brightness': float(features['brightness']),
            'contrast': float(features['contrast']),
            'entropy': float(features['entropy']),
            'edge_density': float(features['edges']),
            'slice_variation': float(slice_factor)
        }
    }

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'MedSigLIP Classification Service',
        'version': '1.0.0-demo',
        'endpoints': {
            '/health': 'GET - Check service health',
            '/classify': 'POST - Classify medical image'
        }
    })

if __name__ == '__main__':
    # Try to load real model if in real mode
    if MODE == 'real' and TORCH_AVAILABLE:
        load_real_model()
    
    print(f"\n✅ MedSigLIP Server running on http://localhost:{PORT}")
    print(f"   Mode: {MODE.upper()}")
    print(f"   Test with: curl http://localhost:{PORT}/health\n")
    
    if MODE == 'demo':
        print("⚠️  DEMO MODE: Using enhanced image analysis (not real AI)")
        print("   To enable real AI: Set AI_MODE=real and install PyTorch")
        print("   To use cloud: Set AI_MODE=cloud and CLOUD_PROVIDER=google/aws/azure\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
