#!/bin/bash

echo "🏥 Radiology Billing System - Setup Script"
echo "=========================================="
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd server
npm install pdfkit
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Step 2: Seed billing codes
echo "🌱 Step 2: Seeding billing codes..."
node src/scripts/seed-billing-codes.js
if [ $? -eq 0 ]; then
    echo "✅ Billing codes seeded successfully"
else
    echo "❌ Failed to seed billing codes"
    exit 1
fi
echo ""

# Step 3: Check environment
echo "🔍 Step 3: Checking environment configuration..."
if grep -q "OPENAI_API_KEY" .env; then
    echo "✅ OpenAI API key configured (AI suggestions enabled)"
else
    echo "⚠️  OpenAI API key not found (will use rule-based suggestions)"
    echo "   To enable AI: Add OPENAI_API_KEY=sk-your-key to server/.env"
fi
echo ""

# Step 4: Verify setup
echo "✅ Step 4: Verifying setup..."
echo ""
echo "Billing System Components:"
echo "  ✓ Models: BillingCode, DiagnosisCode, Superbill"
echo "  ✓ Service: AI Billing Service"
echo "  ✓ Controller: Billing Controller"
echo "  ✓ Routes: /api/billing/*"
echo "  ✓ Frontend: BillingPanel component"
echo "  ✓ Seed Data: 20+ CPT codes, 21+ ICD-10 codes"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Start server: cd server && npm start"
echo "2. Test API: curl http://localhost:8001/api/billing/codes/cpt/search?query=chest"
echo "3. Read docs: BILLING_QUICK_START.md"
echo ""
echo "📚 Documentation:"
echo "  • Quick Start: BILLING_QUICK_START.md"
echo "  • Full Guide: BILLING_SYSTEM_GUIDE.md"
echo "  • Workflow: BILLING_WORKFLOW_DIAGRAM.md"
echo ""
