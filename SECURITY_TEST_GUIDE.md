# Security Testing Guide

## Quick Security Verification

After deploying your Firestore security rules, use these methods to verify they're working correctly.

---

## Method 1: Firebase Console Simulator (Easiest) ⭐

### Step 1: Open Rules Playground

1. Go to https://console.firebase.google.com
2. Select your project (Instaspec-dev or InstaSpec-DHW)
3. Navigate to: **Firestore Database → Rules**
4. Click the **"Rules Playground"** button (top right)

### Step 2: Test Production Rules

Copy and paste these tests one by one:

#### ✅ Test 1: Read Beta User (Should ALLOW)
```
Location: /betaUsers/admin@techarix.com
Operation: get
Authenticated: No
```
**Expected:** ✅ Allow

---

#### ✅ Test 2: Read Non-Existent Beta User (Should ALLOW)
```
Location: /betaUsers/fake@example.com
Operation: get
Authenticated: No
```
**Expected:** ✅ Allow (read allowed, but document won't exist)

---

#### ❌ Test 3: Create Project with Non-Existent User (Should DENY)
```
Location: /projects/test123
Operation: create
Authenticated: No

Simulated Document Data:
{
  "ownerEmail": "notexist@example.com",
  "createdAt": 1704672000000,
  "updatedAt": 1704672000000
}
```
**Expected:** ❌ Deny (user doesn't exist in betaUsers)

---

#### ✅ Test 4: Create Project with Valid User (Should ALLOW)

**First, make sure admin@techarix.com exists in your betaUsers collection!**

```
Location: /projects/test123
Operation: create
Authenticated: No

Simulated Document Data:
{
  "ownerEmail": "admin@techarix.com",
  "createdAt": 1704672000000,
  "updatedAt": 1704672000000
}
```
**Expected:** ✅ Allow (if admin@techarix.com exists in betaUsers)

---

#### ❌ Test 5: Submit Feedback without Beta User (Should DENY)
```
Location: /feedback/test123
Operation: create
Authenticated: No

Simulated Document Data:
{
  "email": "notexist@example.com",
  "context": "Test",
  "message": "Test feedback",
  "createdAt": 1704672000000
}
```
**Expected:** ❌ Deny

---

#### ✅ Test 6: Submit Feedback with Valid User (Should ALLOW)
```
Location: /feedback/test123
Operation: create
Authenticated: No

Simulated Document Data:
{
  "email": "admin@techarix.com",
  "context": "Test",
  "message": "Test feedback",
  "createdAt": 1704672000000
}
```
**Expected:** ✅ Allow (if admin@techarix.com exists in betaUsers)

---

#### ❌ Test 7: Update Feedback (Should DENY - Immutable)
```
Location: /feedback/existingFeedbackId
Operation: update
Authenticated: No

Simulated Document Data:
{
  "email": "admin@techarix.com",
  "context": "Test",
  "message": "Updated message",
  "createdAt": 1704672000000
}
```
**Expected:** ❌ Deny (feedback is immutable)

---

#### ❌ Test 8: Delete Feedback (Should DENY - Immutable)
```
Location: /feedback/existingFeedbackId
Operation: delete
Authenticated: No
```
**Expected:** ❌ Deny (feedback is immutable)

---

## Method 2: Browser Testing Tool

I've created `test-security.html` for you.

### Setup:

1. Open `test-security.html` in a text editor
2. Update the Firebase config (lines 145-165):

```javascript
const configs = {
  dev: {
    apiKey: "YOUR_DEV_API_KEY",           // From .env
    authDomain: "YOUR_DEV_AUTH_DOMAIN",
    projectId: "instaspec-dev",
    // ... etc
  },
  prod: {
    apiKey: "YOUR_PROD_API_KEY",          // From .env
    authDomain: "YOUR_PROD_AUTH_DOMAIN",
    projectId: "instaspec-dhw",
    // ... etc
  }
};
```

3. Open `test-security.html` in your browser
4. Select environment (Dev or Prod)
5. Click "Run All Tests"

### What It Tests:

- ✅ Read beta users
- ✅ Create projects with valid users
- ❌ Create projects with invalid users (should fail)
- ✅ Submit feedback with valid users
- ❌ Submit feedback with invalid users (should fail)
- ❌ Update feedback (should fail - immutable)
- ✅ Create login logs
- ✅ Update usage tracking

---

## Method 3: Browser Console Testing

### Step 1: Open Your App

```bash
npm run dev
```

Visit http://localhost:5173

### Step 2: Open Browser Console

Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### Step 3: Run These Tests

#### Test 1: Try to Create Project with Fake User

```javascript
import { db } from './src/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

// This should FAIL in production
await setDoc(doc(db, 'projects', 'test_fake_user'), {
  ownerEmail: 'fake@example.com',
  name: 'Test Project',
  createdAt: Date.now(),
  updatedAt: Date.now()
});
// Expected: Error - user doesn't exist in betaUsers
```

#### Test 2: Try to Create Project with Valid User

```javascript
// This should SUCCEED (if admin@techarix.com exists)
await setDoc(doc(db, 'projects', 'test_valid_user'), {
  ownerEmail: 'admin@techarix.com',
  name: 'Test Project',
  createdAt: Date.now(),
  updatedAt: Date.now()
});
// Expected: Success
```

#### Test 3: Try to Update Feedback (Should Fail)

```javascript
import { collection, addDoc, updateDoc } from 'firebase/firestore';

// First create feedback
const feedbackRef = await addDoc(collection(db, 'feedback'), {
  email: 'admin@techarix.com',
  context: 'Test',
  message: 'Original message',
  createdAt: Date.now()
});

// Now try to update it (should FAIL - immutable)
await updateDoc(feedbackRef, {
  message: 'Updated message'
});
// Expected: Error - feedback is immutable
```

---

## Method 4: Check Firebase Console Logs

### Step 1: Go to Firebase Console

1. https://console.firebase.google.com
2. Select your project
3. Navigate to: **Firestore Database → Usage**

### Step 2: Look for Denied Requests

- If you see **"Denied"** requests, check the details
- Make sure they're legitimate denials (e.g., invalid users)
- If valid operations are being denied, review your rules

### Step 3: Monitor Real-Time

- Go to **Firestore Database → Data**
- Try operations in your app
- Watch for permission denied errors

---

## Expected Results Summary

### Development Environment (Instaspec-dev)

| Operation | Expected Result |
|-----------|----------------|
| Read any document | ✅ Allow |
| Write any document | ✅ Allow |
| Update feedback | ❌ Deny (immutable) |
| Delete feedback | ❌ Deny (immutable) |
| Delete login logs | ❌ Deny (immutable) |

### Production Environment (InstaSpec-DHW)

| Operation | Expected Result |
|-----------|----------------|
| Read betaUsers | ✅ Allow |
| Create project (valid user) | ✅ Allow |
| Create project (invalid user) | ❌ Deny |
| Submit feedback (valid user) | ✅ Allow |
| Submit feedback (invalid user) | ❌ Deny |
| Update feedback | ❌ Deny (immutable) |
| Delete feedback | ❌ Deny (immutable) |
| Read feedback (non-admin) | ❌ Deny |
| Read feedback (admin) | ✅ Allow |
| Update login logs | ❌ Deny (immutable) |
| Create beta user (non-admin) | ❌ Deny |
| Create beta user (admin email) | ✅ Allow |

---

## Common Issues and Solutions

### Issue 1: All Operations Denied

**Cause:** Rules not deployed correctly

**Solution:**
```bash
# Redeploy rules
npm run deploy:rules:prod
```

### Issue 2: Valid User Getting Denied

**Cause:** User doesn't exist in betaUsers collection

**Solution:**
1. Go to Firebase Console
2. Firestore Database → Data
3. Check if `betaUsers/{email}` exists
4. Verify email is lowercase
5. Check `expiresAt` is null or in future

### Issue 3: Invalid User Allowed

**Cause:** Using dev rules in production

**Solution:**
```bash
# Make sure you deployed prod rules
firebase use prod
npm run deploy:rules:prod
```

### Issue 4: Rules Simulator Shows Different Result

**Cause:** Rules not propagated yet

**Solution:**
- Wait 1-2 minutes
- Clear browser cache
- Check deployment was successful

---

## Security Checklist

After testing, verify:

- [ ] Invalid users CANNOT create projects
- [ ] Valid users CAN create projects
- [ ] Invalid users CANNOT submit feedback
- [ ] Valid users CAN submit feedback
- [ ] Feedback CANNOT be updated/deleted
- [ ] Login logs CANNOT be updated/deleted
- [ ] Non-admins CANNOT read feedback
- [ ] Non-admins CANNOT create beta users
- [ ] Expired users CANNOT perform operations
- [ ] Email validation works (invalid emails denied)
- [ ] Size limits enforced (5000 char messages, 5MB images)
- [ ] Ownership verified (users can't access others' projects)

---

## Quick Verification Commands

```bash
# Check which Firebase project is active
firebase use

# View current rules in console
firebase firestore:rules:get

# Test deployment
firebase deploy --only firestore:rules --dry-run

# View deployment history
firebase deploy:history
```

---

## Need Help?

If tests are failing unexpectedly:

1. Check Firebase Console → Rules tab
2. Verify rules match `firestore.rules.prod`
3. Check Firebase Console → Usage tab for denied requests
4. Review error messages in browser console
5. Ensure beta user exists with correct structure:

```json
{
  "email": "admin@techarix.com",
  "code": "BETA-XXXX-XXXX",
  "plan": "beta_admin",
  "isAdmin": true,
  "expiresAt": null,
  "createdAt": 1704672000000,
  "updatedAt": 1704672000000
}
```

Your database is secure when invalid operations are denied and valid operations succeed! 🔒
