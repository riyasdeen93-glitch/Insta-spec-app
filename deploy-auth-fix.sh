#!/bin/bash

# Deployment script for Firestore Authentication Fix
# Date: January 16, 2026

echo "=================================================="
echo "Firestore Authentication Fix - Deployment Script"
echo "=================================================="
echo ""

# Step 1: Check if Firebase CLI is installed
echo "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi
echo "✅ Firebase CLI found"
echo ""

# Step 2: Check if logged in to Firebase
echo "Step 2: Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null
then
    echo "❌ Not logged in to Firebase. Running login..."
    firebase login
else
    echo "✅ Already logged in to Firebase"
fi
echo ""

# Step 3: Display current Firebase project
echo "Step 3: Current Firebase project:"
firebase use
echo ""

# Step 4: Deploy Firestore rules
echo "Step 4: Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Firestore rules deployment failed"
    exit 1
fi
echo ""

# Step 5: Reminder to enable Anonymous Auth
echo "=================================================="
echo "⚠️  IMPORTANT: Manual Step Required"
echo "=================================================="
echo ""
echo "Please enable Anonymous Authentication in Firebase Console:"
echo ""
echo "1. Go to https://console.firebase.google.com"
echo "2. Select your project"
echo "3. Go to Authentication → Sign-in method"
echo "4. Find 'Anonymous' provider"
echo "5. Click Edit"
echo "6. Toggle 'Enable' ON"
echo "7. Click Save"
echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Enable Anonymous Auth (see instructions above)"
echo "2. Clear browser data (localStorage + cookies)"
echo "3. Reload the app and check console for authentication logs"
echo "4. Follow the testing guide in AUTHENTICATION_TEST_GUIDE.md"
echo ""
