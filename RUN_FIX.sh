#!/bin/bash
# SPA Routing Fix - EXACT COMMANDS TO RUN

echo "================================"
echo "🚀 SPA Routing Fix - Step by Step"
echo "================================"
echo ""

# Step 1: Navigate to project
echo "Step 1️⃣: Navigate to project directory"
echo "$ cd /Users/devanshu/Desktop/shree-collection/shree-collection"
cd /Users/devanshu/Desktop/shree-collection/shree-collection || exit
echo "✓ Done"
echo ""

# Step 2: Clean install
echo "Step 2️⃣: Install dependencies"
echo "$ npm install"
npm install
echo "✓ Done"
echo ""

# Step 3: Build
echo "Step 3️⃣: Build production app"
echo "$ npm run build"
npm run build
echo "✓ Done - check that dist/ folder was created"
echo ""

# Step 4: Verify dist
echo "Step 4️⃣: Verify dist/ folder"
echo "$ ls -la dist/"
ls -la dist/ | head -20
echo "✓ dist/index.html should be listed above"
echo ""

# Step 5: Test locally
echo "Step 5️⃣: Test locally (press Ctrl+C to stop)"
echo "$ npm run start:prod"
echo ""
echo "Expected: Server running on http://localhost:3000"
echo "Visit these URLs in your browser:"
echo "  - http://localhost:3000/ → Home (should work)"
echo "  - http://localhost:3000/terms → Terms (should work, NOT 404)"
echo "  - http://localhost:3000/privacy → Privacy (should work, NOT 404)"
echo ""
read -p "Ready to start local server? (Enter to continue, Ctrl+C to skip): " -r
npm run start:prod &
SERVER_PID=$!
echo ""
echo "Server running (PID: $SERVER_PID)"
echo "Visit http://localhost:3000/terms in your browser"
read -p "Press Enter after testing, then we'll stop the server: " -r
kill $SERVER_PID
echo "✓ Server stopped"
echo ""

# Step 6: Git commit & push
echo "Step 6️⃣: Commit and push to Railway"
echo "$ git status"
git status
echo ""
echo "$ git add -A"
git add -A
echo ""
echo "$ git commit -m 'Fix: Enable SPA routing by including dist/ in deployment'"
git commit -m "Fix: Enable SPA routing by including dist/ in deployment"
echo ""
echo "$ git push origin main"
git push origin main
echo "✓ Done - Railway will auto-deploy"
echo ""

echo "Step 7️⃣: Monitor Railway deployment"
echo "Go to: https://railway.app"
echo "1. Click your project"
echo "2. Click 'Deployments' tab"
echo "3. Wait for latest deployment to complete"
echo "4. Check logs for any errors"
echo ""

echo "Step 8️⃣: Test production"
echo "After deployment completes, visit:"
echo "  - https://shreecollection.co.in/ → Home"
echo "  - https://shreecollection.co.in/terms → Terms"
echo "  - https://shreecollection.co.in/privacy → Privacy"
echo ""
echo "All should work without 404! ✅"
echo ""
echo "================================"
echo "✅ All steps completed!"
echo "================================"

