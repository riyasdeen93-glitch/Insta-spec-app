@echo off
REM Deployment script for Firestore Authentication Fix
REM Date: January 16, 2026

echo ==================================================
echo Firestore Authentication Fix - Deployment Script
echo ==================================================
echo.

REM Step 1: Check if Firebase CLI is installed
echo Step 1: Checking Firebase CLI...
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Firebase CLI not found. Please install it first:
    echo    npm install -g firebase-tools
    pause
    exit /b 1
)
echo √ Firebase CLI found
echo.

REM Step 2: Check if logged in to Firebase
echo Step 2: Checking Firebase authentication...
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Not logged in to Firebase. Running login...
    firebase login
) else (
    echo √ Already logged in to Firebase
)
echo.

REM Step 3: Display current Firebase project
echo Step 3: Current Firebase project:
firebase use
echo.

REM Step 4: Deploy Firestore rules
echo Step 4: Deploying Firestore security rules...
firebase deploy --only firestore:rules

if %ERRORLEVEL% EQU 0 (
    echo √ Firestore rules deployed successfully
) else (
    echo X Firestore rules deployment failed
    pause
    exit /b 1
)
echo.

REM Step 5: Reminder to enable Anonymous Auth
echo ==================================================
echo !  IMPORTANT: Manual Step Required
echo ==================================================
echo.
echo Please enable Anonymous Authentication in Firebase Console:
echo.
echo 1. Go to https://console.firebase.google.com
echo 2. Select your project
echo 3. Go to Authentication -^> Sign-in method
echo 4. Find 'Anonymous' provider
echo 5. Click Edit
echo 6. Toggle 'Enable' ON
echo 7. Click Save
echo.
echo ==================================================
echo Deployment Complete!
echo ==================================================
echo.
echo Next steps:
echo 1. Enable Anonymous Auth (see instructions above)
echo 2. Clear browser data (localStorage + cookies)
echo 3. Reload the app and check console for authentication logs
echo 4. Follow the testing guide in AUTHENTICATION_TEST_GUIDE.md
echo.
pause
