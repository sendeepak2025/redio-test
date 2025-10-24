#!/bin/bash

# Quick Fix Commands for Series Selector Issue
# Run this to fix the duplicate study problem

echo "🔧 Starting Quick Fix..."
echo ""

# Step 1: Clean the specific study from database
echo "Step 1: Cleaning old study data from database..."
mongo dicomdb --eval '
db.studies.deleteMany({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
});
db.instances.deleteMany({ 
  studyInstanceUID: "1.2.840.113619.2.482.3.2831195393.851.1709524269.885" 
});
print("✅ Old data deleted");
'

echo ""
echo "Step 2: Re-syncing study from Orthanc..."
echo "Please run in another terminal:"
echo "  cd server"
echo "  node auto-sync-simple.js"
echo ""
echo "Wait for this message:"
echo "  ✅ Created 266 instance records from 3 series"
echo ""
echo "Then press Ctrl+C to stop auto-sync"
echo ""
echo "Step 3: Start backend server:"
echo "  cd server"
echo "  npm start"
echo ""
echo "Step 4: Test in browser:"
echo "  http://localhost:3000/viewer/1.2.840.113619.2.482.3.2831195393.851.1709524269.885"
echo ""
echo "✅ Fix complete!"
