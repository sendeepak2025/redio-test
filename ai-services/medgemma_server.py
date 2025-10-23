"""
MedGemma Server - Multi-Mode Radiology Report Generation
Supports: Real AI Models, Cloud APIs, and Enhanced Demo Mode
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
import time
import os
import random
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
PORT = int(os.getenv('PORT', 5002))
MODE = os.getenv('AI_MODE', 'demo')  # 'real', 'cloud', or 'demo'
CLOUD_PROVIDER = os.getenv('CLOUD_PROVIDER', 'none')

# Try to import deep learning libraries
try:
    import torch
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
TOKENIZER = None

print(f"🚀 Starting MedGemma Server")
print(f"   Mode: {MODE.upper()}")
print(f"   Device: {DEVICE}")
print(f"   Port: {PORT}")
print(f"   PyTorch: {'Available' if TORCH_AVAILABLE else 'Not Available'}")
print(f"   Cloud: {CLOUD_PROVIDER.upper() if CLOUD_AVAILABLE else 'Not Configured'}")

# Report templates for different modalities
REPORT_TEMPLATES = {
    'XR': {
        'normal': {
            'findings': 'The lungs are clear bilaterally without focal consolidation, pleural effusion, or pneumothorax. The cardiac silhouette is normal in size and contour. The mediastinal and hilar contours are unremarkable. No acute osseous abnormality is identified.',
            'impression': 'No acute cardiopulmonary abnormality.'
        },
        'abnormal': {
            'findings': 'There is increased opacity in the {location} consistent with {finding}. The cardiac silhouette appears {cardiac_status}. {additional_findings}',
            'impression': '{finding} identified. Clinical correlation recommended.'
        }
    },
    'CT': {
        'normal': {
            'findings': 'The examination demonstrates normal anatomic structures without evidence of acute abnormality. No mass, hemorrhage, or abnormal enhancement is identified.',
            'impression': 'No acute findings.'
        },
        'abnormal': {
            'findings': 'There is a {size} {density} {finding} in the {location}. {characteristics} No significant mass effect or midline shift.',
            'impression': '{finding} as described. Recommend {recommendation}.'
        }
    },
    'MR': {
        'normal': {
            'findings': 'Normal brain parenchyma without evidence of acute infarction, hemorrhage, or mass effect. The ventricles and sulci are normal in size and configuration.',
            'impression': 'No acute intracranial abnormality.'
        },
        'abnormal': {
            'findings': 'There is abnormal signal intensity in the {location} measuring approximately {size}. {characteristics}',
            'impression': '{finding} as described. Clinical correlation and follow-up recommended.'
        }
    }
}

def load_real_model():
    """Load real MedGemma model from Hugging Face"""
    global MODEL, TOKENIZER
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        print("📥 Loading MedGemma model from Hugging Face...")
        MODEL = AutoModelForCausalLM.from_pretrained("microsoft/llava-med-v1.5-mistral-7b")
        TOKENIZER = AutoTokenizer.from_pretrained("microsoft/llava-med-v1.5-mistral-7b")
        MODEL.to(DEVICE)
        MODEL.eval()
        print("✅ Real AI model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to load real model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    model_status = 'loaded' if MODEL is not None else 'not loaded'
    return jsonify({
        'status': 'healthy',
        'mode': MODE,
        'model': f'MedGemma ({MODE} mode)',
        'model_status': model_status,
        'device': DEVICE,
        'gpu_available': TORCH_AVAILABLE and torch.cuda.is_available() if TORCH_AVAILABLE else False,
        'cloud_provider': CLOUD_PROVIDER if CLOUD_AVAILABLE else 'none',
        'torch_available': TORCH_AVAILABLE,
        'cloud_available': CLOUD_AVAILABLE
    })

@app.route('/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        image_b64 = data.get('image')
        modality = data.get('modality', 'XR')
        patient_context = data.get('patientContext', {})
        
        # Decode image
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        start_time = time.time()
        
        # Route to appropriate method based on MODE
        if MODE == 'real' or MODE == 'cloud':
            return generate_real_report(image, image_bytes, modality, patient_context, start_time)
        else:
            return generate_demo_report(image, modality, patient_context, start_time)
        
        # Simulate processing time
        time.sleep(1.0)
        
        # Extract patient info
        age = patient_context.get('age', 'unknown')
        sex = patient_context.get('sex', 'unknown')
        history = patient_context.get('clinicalHistory', 'not provided')
        indication = patient_context.get('indication', 'not specified')
        
        # Analyze image for demo with more sophisticated features
        width, height = image.size
        pixels = list(image.convert('L').getdata())
        avg_brightness = sum(pixels) / len(pixels)
        
        # Calculate additional features for better differentiation
        variance = sum((p - avg_brightness) ** 2 for p in pixels[:2000]) / 2000
        
        # Calculate histogram
        histogram = [0] * 4
        for p in pixels[::20]:  # Sample every 20th pixel
            histogram[min(3, int(p / 64))] += 1
        
        contrast = (histogram[3] - histogram[0]) / max(sum(histogram), 1)
        
        # More sophisticated determination
        brightness_score = avg_brightness / 255.0
        variance_score = min(variance / 5000.0, 1.0)
        combined_score = (brightness_score * 0.5 + variance_score * 0.3 + abs(contrast) * 0.2)
        
        # Determine if "normal" or "abnormal" based on combined features
        is_normal = combined_score > 0.55
        
        # Get template
        modality_key = modality if modality in REPORT_TEMPLATES else 'XR'
        template = REPORT_TEMPLATES[modality_key]['normal' if is_normal else 'abnormal']
        
        # Generate report
        if is_normal:
            findings = f"""TECHNIQUE:
{modality} imaging was performed according to standard protocol.

CLINICAL HISTORY:
{history}

FINDINGS:
{template['findings']}

Image quality is adequate for diagnostic interpretation."""

            impression = template['impression']
            recommendations = ['No follow-up needed', 'Clinical correlation as needed']
            
        else:
            # Generate "abnormal" findings with variations based on image features
            locations = ['right upper lobe', 'left lower lobe', 'right middle lobe', 'bilateral bases', 'left upper lobe', 'right lower lobe']
            findings_list = ['consolidation', 'opacity', 'nodule', 'infiltrate', 'atelectasis', 'pleural thickening']
            cardiac_statuses = ['normal in size', 'mildly enlarged', 'within normal limits', 'borderline enlarged']
            
            # Use image features to select findings (more deterministic but varied)
            location_idx = int((avg_brightness % 60) / 10)
            finding_idx = int((variance % 600) / 100)
            cardiac_idx = int((contrast * 100) % 4)
            
            location = locations[min(location_idx, len(locations) - 1)]
            finding = findings_list[min(finding_idx, len(findings_list) - 1)]
            cardiac = cardiac_statuses[min(cardiac_idx, len(cardiac_statuses) - 1)]
            
            findings = f"""TECHNIQUE:
{modality} imaging was performed according to standard protocol.

CLINICAL HISTORY:
{history}

FINDINGS:
{template['findings'].format(
    location=location,
    finding=finding,
    cardiac_status=cardiac,
    additional_findings='No pleural effusion or pneumothorax identified.'
)}

Image quality is adequate for diagnostic interpretation."""

            impression = template['impression'].format(finding=finding.capitalize())
            recommendations = [
                'Clinical correlation recommended',
                'Consider follow-up imaging in 4-6 weeks',
                'Radiologist review required'
            ]
        
        processing_time = time.time() - start_time
        
        return jsonify({
            'findings': findings,
            'impression': impression,
            'recommendations': recommendations,
            'processing_time': processing_time,
            'confidence': 0.78 if is_normal else 0.72,
            'demo_mode': True,
            'patient_age': age,
            'patient_sex': sex,
            'modality': modality
        })
        
    except Exception as e:
        print(f"❌ Error in generate_report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'service': 'MedGemma Report Generation Service',
        'version': '1.0.0-demo',
        'endpoints': {
            '/health': 'GET - Check service health',
            '/generate-report': 'POST - Generate radiology report'
        }
    })

def generate_real_report(image, image_bytes, modality, patient_context, start_time):
    """Generate report using real AI (Hugging Face API)"""
    try:
        import requests
        
        # Use LLaVA-Med or similar vision-language model
        API_URL = "https://api-inference.huggingface.co/models/microsoft/llava-med-v1.5-mistral-7b"
        headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN', '')}"}
        
        # Prepare prompt
        age = patient_context.get('age', 'unknown')
        sex = patient_context.get('sex', 'unknown')
        history = patient_context.get('clinicalHistory', 'not provided')
        
        prompt = f"""Generate a radiology report for this {modality} image.
Patient: {age} year old {sex}
Clinical History: {history}

Please provide:
1. FINDINGS: Detailed description of what you see
2. IMPRESSION: Summary and diagnosis
3. RECOMMENDATIONS: Follow-up suggestions

Format as a professional radiology report."""
        
        # Convert image to base64
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_b64 = base64.b64encode(img_byte_arr.getvalue()).decode()
        
        payload = {
            "inputs": {
                "image": img_b64,
                "text": prompt
            }
        }
        
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            generated_text = result.get('generated_text', '') if isinstance(result, dict) else str(result)
            
            # Parse the generated report
            findings, impression, recommendations = parse_generated_report(generated_text)
            
            processing_time = time.time() - start_time
            
            return jsonify({
                'findings': findings,
                'impression': impression,
                'recommendations': recommendations,
                'processing_time': processing_time,
                'confidence': 0.85,
                'demo_mode': False,
                'model': 'LLaVA-Med (Real AI)',
                'patient_age': age,
                'patient_sex': sex,
                'modality': modality
            })
        else:
            print(f"Hugging Face API error: {response.status_code}")
            return generate_demo_report(image, modality, patient_context, start_time)
            
    except Exception as e:
        print(f"Real AI report generation failed: {e}")
        return generate_demo_report(image, modality, patient_context, start_time)

def parse_generated_report(text):
    """Parse AI-generated report into sections"""
    findings = ""
    impression = ""
    recommendations = []
    
    # Try to extract sections
    if "FINDINGS:" in text:
        findings = text.split("FINDINGS:")[1].split("IMPRESSION:")[0].strip()
    if "IMPRESSION:" in text:
        impression = text.split("IMPRESSION:")[1].split("RECOMMENDATIONS:")[0].strip()
    if "RECOMMENDATIONS:" in text:
        rec_text = text.split("RECOMMENDATIONS:")[1].strip()
        recommendations = [r.strip() for r in rec_text.split('\n') if r.strip()]
    
    # Fallback if parsing fails
    if not findings:
        findings = text[:500] if len(text) > 500 else text
    if not impression:
        impression = "AI-generated analysis provided above. Radiologist review required."
    if not recommendations:
        recommendations = ["Radiologist review recommended", "Clinical correlation advised"]
    
    return findings, impression, recommendations

def generate_demo_report(image, modality, patient_context, start_time):
    """Generate demo report (current method)"""
    # [Keep existing demo report generation code]
    time.sleep(1.0)
    
    age = patient_context.get('age', 'unknown')
    sex = patient_context.get('sex', 'unknown')
    history = patient_context.get('clinicalHistory', 'not provided')
    
    # Analyze image
    width, height = image.size
    pixels = list(image.convert('L').getdata())
    avg_brightness = sum(pixels) / len(pixels)
    variance = sum((p - avg_brightness) ** 2 for p in pixels[:2000]) / 2000
    
    histogram = [0] * 4
    for p in pixels[::20]:
        histogram[min(3, int(p / 64))] += 1
    
    contrast = (histogram[3] - histogram[0]) / max(sum(histogram), 1)
    brightness_score = avg_brightness / 255.0
    variance_score = min(variance / 5000.0, 1.0)
    combined_score = (brightness_score * 0.5 + variance_score * 0.3 + abs(contrast) * 0.2)
    
    is_normal = combined_score > 0.55
    modality_key = modality if modality in REPORT_TEMPLATES else 'XR'
    template = REPORT_TEMPLATES[modality_key]['normal' if is_normal else 'abnormal']
    
    if is_normal:
        findings = f"""TECHNIQUE:
{modality} imaging was performed according to standard protocol.

CLINICAL HISTORY:
{history}

FINDINGS:
{template['findings']}

Image quality is adequate for diagnostic interpretation."""
        impression = template['impression']
        recommendations = ['No follow-up needed', 'Clinical correlation as needed']
    else:
        locations = ['right upper lobe', 'left lower lobe', 'right middle lobe', 'bilateral bases']
        findings_list = ['consolidation', 'opacity', 'nodule', 'infiltrate']
        
        location_idx = int((avg_brightness % 40) / 10)
        finding_idx = int((variance % 400) / 100)
        
        location = locations[min(location_idx, len(locations) - 1)]
        finding = findings_list[min(finding_idx, len(findings_list) - 1)]
        
        findings = f"""TECHNIQUE:
{modality} imaging was performed.

CLINICAL HISTORY:
{history}

FINDINGS:
{template['findings'].format(location=location, finding=finding, cardiac_status='normal', additional_findings='No acute findings.')}"""
        impression = template['impression'].format(finding=finding)
        recommendations = ['Radiologist review recommended', 'Clinical correlation advised']
    
    processing_time = time.time() - start_time
    
    return jsonify({
        'findings': findings,
        'impression': impression,
        'recommendations': recommendations,
        'processing_time': processing_time,
        'confidence': 0.72,
        'demo_mode': True,
        'patient_age': age,
        'patient_sex': sex,
        'modality': modality
    })

if __name__ == '__main__':
    print(f"\n✅ MedGemma Server running on http://localhost:{PORT}")
    print(f"   Mode: {MODE.upper()}")
    print(f"   Test with: curl http://localhost:{PORT}/health\n")
    
    if MODE == 'demo':
        print("⚠️  DEMO MODE: Using template-based reports (not real AI)")
        print("   To enable real AI: Set AI_MODE=real or AI_MODE=cloud\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
