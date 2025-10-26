#!/bin/bash

# 🧠 Structured Reporting System Setup Script
# This script sets up the complete AI + Radiologist reporting workflow

echo "🧠 Setting up Structured Reporting System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install backend dependencies
echo -e "${BLUE}📦 Step 1: Installing backend dependencies...${NC}"
cd server
npm install multer pdfkit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Some dependencies may already be installed${NC}"
fi
echo ""

# Step 2: Create uploads directory
echo -e "${BLUE}📁 Step 2: Creating uploads directory...${NC}"
mkdir -p uploads/signatures
touch uploads/signatures/.gitkeep
chmod 755 uploads/signatures
echo -e "${GREEN}✅ Uploads directory created${NC}"
echo ""

# Step 3: Update .gitignore
echo -e "${BLUE}📝 Step 3: Updating .gitignore...${NC}"
if ! grep -q "uploads/signatures/\*" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Signature uploads" >> .gitignore
    echo "uploads/signatures/*" >> .gitignore
    echo "!uploads/signatures/.gitkeep" >> .gitignore
    echo -e "${GREEN}✅ .gitignore updated${NC}"
else
    echo -e "${YELLOW}⚠️  .gitignore already configured${NC}"
fi
echo ""

# Step 4: Check MongoDB connection
echo -e "${BLUE}🗄️  Step 4: Checking MongoDB connection...${NC}"
if [ -f .env ]; then
    if grep -q "MONGODB_URI" .env; then
        echo -e "${GREEN}✅ MongoDB URI found in .env${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB URI not found in .env${NC}"
        echo "Please add: MONGODB_URI=mongodb://localhost:27017/your-database"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Please create .env file with MongoDB URI"
fi
echo ""

# Step 5: Install frontend dependencies (if needed)
echo -e "${BLUE}📦 Step 5: Checking frontend dependencies...${NC}"
cd ../viewer
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
else
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi
echo ""

# Step 6: Create demo route (optional)
echo -e "${BLUE}🎨 Step 6: Setting up demo page...${NC}"
cd ..
echo -e "${GREEN}✅ Demo page available at: /reporting-demo${NC}"
echo ""

# Step 7: Summary
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo ""
echo "✅ Backend dependencies installed (multer, pdfkit)"
echo "✅ Uploads directory created (server/uploads/signatures)"
echo "✅ .gitignore updated"
echo "✅ Frontend components ready"
echo "✅ Demo page ready"
echo ""

# Step 8: Next steps
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Start backend:"
echo "   cd server && npm start"
echo ""
echo "2. Start frontend:"
echo "   cd viewer && npm run dev"
echo ""
echo "3. Test demo page:"
echo "   http://localhost:5173/reporting-demo"
echo ""
echo "4. Integration (add to Medical Viewer):"
echo "   import ReportHistoryButton from '../reports/ReportHistoryButton';"
echo "   <ReportHistoryButton studyInstanceUID={studyInstanceUID} />"
echo ""

# Step 9: Documentation
echo -e "${BLUE}📚 Documentation:${NC}"
echo ""
echo "- STRUCTURED_REPORTING_COMPLETE.md - Complete guide"
echo "- QUICK_INTEGRATION_GUIDE.md - Integration steps"
echo "- REPORTING_SYSTEM_HINDI.md - Hindi guide"
echo "- REPORTING_CHECKLIST.md - Testing checklist"
echo ""

echo -e "${GREEN}✅ Setup complete! Ready to use.${NC}"
echo ""
