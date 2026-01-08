# Multi-Environment Firestore Deployment Guide

## Your Firebase Setup

You have two Firebase databases:

1. **Instaspec-dev** (Development) - For localhost testing
2. **InstaSpec-DHW** (Production) - Live public database

## Security Rules Files

Three security rule files have been created:

### 1. `firestore.rules.dev` - Development Rules
- **Deploy to:** Instaspec-dev
- **Purpose:** Permissive rules for localhost testing
- **Security:** Low (allows most operations for easy testing)
- **⚠️ WARNING:** NEVER deploy this to production!

### 2. `firestore.rules.prod` - Production Rules
- **Deploy to:** InstaSpec-DHW
- **Purpose:** Secure rules for public use
- **Security:** High (validates all operations, no Firebase Auth required)
- **Designed for:** Your custom beta authentication system

### 3. `firestore.rules` - Template
- Original template with Firebase Auth requirements
- Reference only (not for deployment with current setup)

## Key Differences

### Development Rules (firestore.rules.dev)
```
✓ Allows all reads
✓ Minimal validation
✓ Easy debugging
✓ Fast development
✗ NOT secure for public use
```

### Production Rules (firestore.rules.prod)
```
✓ Validates beta user existence
✓ Checks expiration dates
✓ Validates email formats
✓ Enforces data structure
✓ Admin-only operations
✓ Immutable logs/feedback
✓ Size limits enforced
```

## How Production Rules Work (Without Firebase Auth)

Since you're using **custom localStorage authentication**, the production rules validate users by:

1. Checking if email exists in `betaUsers` collection
2. Verifying user is not expired
3. Validating admin status from `betaUsers` document
4. Enforcing data ownership via email matching

**No Firebase Authentication required!** ✓

## Deployment Instructions

### Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Initial Setup

```bash
# Initialize Firebase in your project
firebase init firestore
```

When prompted:
- Select **both** projects (Instaspec-dev and InstaSpec-DHW)
- Rules file: `firestore.rules.dev` (you'll change this later)
- Indexes file: `firestore.indexes.json`

### Configure .firebaserc

Create/update `.firebaserc` file:

```json
{
  "projects": {
    "dev": "instaspec-dev",
    "prod": "instaspec-dhw"
  }
}
```

### Deploy to Development

```bash
# Use dev environment
firebase use dev

# Copy dev rules to main rules file
cp firestore.rules.dev firestore.rules

# Deploy
firebase deploy --only firestore:rules

# Verify in Firebase Console
```

### Deploy to Production

```bash
# Switch to production environment
firebase use prod

# Copy production rules to main rules file
cp firestore.rules.prod firestore.rules

# Deploy
firebase deploy --only firestore:rules

# Verify in Firebase Console
```

## Automated Deployment Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "deploy:rules:dev": "firebase use dev && cp firestore.rules.dev firestore.rules && firebase deploy --only firestore:rules",
    "deploy:rules:prod": "firebase use prod && cp firestore.rules.prod firestore.rules && firebase deploy --only firestore:rules",
    "deploy:dev": "firebase use dev && npm run build && firebase deploy",
    "deploy:prod": "firebase use prod && npm run build && firebase deploy"
  }
}
```

Usage:
```bash
# Deploy only rules to dev
npm run deploy:rules:dev

# Deploy only rules to production
npm run deploy:rules:prod

# Full deployment to dev
npm run deploy:dev

# Full deployment to production
npm run deploy:prod
```

## Production Security Features

### 1. Beta User Validation
```javascript
// Users must exist in betaUsers collection
// Automatically checked by rules
```

### 2. Expiration Checking
```javascript
// Rules check: expiresAt == null || expiresAt > now
// Expired users cannot perform operations
```

### 3. Admin Protection
```javascript
// Only admin@techarix.com can:
// - Create/delete beta users
// - Set isAdmin = true
// - Read all feedback
// - Modify metadata
```

### 4. Data Validation
- Email format validation
- Required fields enforcement
- Data type checking
- Size limits:
  - Messages: 5000 characters max
  - Images: 5MB max

### 5. Ownership Validation
- Projects: Verified by ownerEmail
- Usage: Verified by email document ID
- Feedback: Email must match beta user

### 6. Immutable Collections
- `betaLoginLogs` - Write-once, no updates/deletes
- `feedback` - Write-once, no updates/deletes

## Testing Before Production Deployment

### 1. Use Firebase Emulator

```bash
# Start emulator with dev rules
firebase use dev
cp firestore.rules.dev firestore.rules
firebase emulators:start --only firestore
```

### 2. Test with Production Rules Locally

```bash
# Test production rules in emulator
cp firestore.rules.prod firestore.rules
firebase emulators:start --only firestore

# Run your app against emulator
# Update firebase config to use emulator
```

### 3. Verify Operations

Test these scenarios:
- [ ] Valid beta user can create projects
- [ ] Expired beta user cannot create projects
- [ ] Non-existent user cannot create projects
- [ ] Users can only read their own projects
- [ ] Admin can read all feedback
- [ ] Non-admin cannot read feedback
- [ ] Feedback cannot be updated/deleted
- [ ] Login logs cannot be modified

## Environment-Specific Firebase Config

Update your `.env` files:

### `.env.development`
```env
VITE_FB_PROJECT_ID=instaspec-dev
# Other Instaspec-dev config...
```

### `.env.production`
```env
VITE_FB_PROJECT_ID=instaspec-dhw
# Other InstaSpec-DHW config...
```

## Monitoring and Alerts

### 1. Enable Firebase Monitoring

Go to Firebase Console → Firestore → Usage tab:
- Monitor read/write operations
- Check for denied requests
- Review performance

### 2. Set Up Alerts

Firebase Console → Alerts:
- High number of denied requests
- Unusual write patterns
- Quota approaching limits

### 3. Review Logs

```bash
# View recent logs
firebase projects:list
firebase use prod
firebase firestore:indexes

# Check for errors in Console
```

## Security Best Practices

### ✓ DO:
1. Always test rules in dev before deploying to prod
2. Keep `.env` files out of version control
3. Regularly review denied requests in console
4. Monitor for unusual access patterns
5. Keep dev and prod rules separate
6. Document any rule changes
7. Test after every deployment

### ✗ DON'T:
1. Never deploy dev rules to production
2. Don't store secrets in Firestore
3. Don't skip testing before production deploy
4. Don't give admin access to untrusted emails
5. Don't deploy without reviewing changes
6. Don't ignore security alerts

## Troubleshooting

### "Permission Denied" Errors

1. **Check beta user exists:**
   ```javascript
   // In Firebase Console, verify betaUsers/{email} exists
   ```

2. **Check expiration:**
   ```javascript
   // Verify expiresAt is null or in future
   ```

3. **Check email format:**
   ```javascript
   // Must be lowercase, valid email format
   ```

4. **Check required fields:**
   ```javascript
   // All required fields must be present in write
   ```

### Rules Not Taking Effect

1. Clear browser cache
2. Verify deployment succeeded
3. Check Firebase Console shows latest rules
4. Wait 1-2 minutes for propagation

### Rules Simulator

Use Firebase Console → Firestore → Rules tab → Simulator:
```
Location: /projects/test123
Operation: Create
Authenticated: No

// Test with different scenarios
```

## Rollback Procedure

If production rules cause issues:

### Quick Rollback (Emergency)

1. Go to Firebase Console
2. Firestore → Rules tab
3. Click "History"
4. Select previous working version
5. Click "Publish"

### Proper Rollback

```bash
# Revert to previous rules file
git checkout HEAD~1 firestore.rules.prod

# Deploy
firebase use prod
cp firestore.rules.prod firestore.rules
firebase deploy --only firestore:rules
```

## Deployment Checklist

### Before Deploying to Production:

- [ ] Test rules in emulator
- [ ] Test with dev database
- [ ] Review all changes in rules file
- [ ] Verify admin emails are correct
- [ ] Check size limits are appropriate
- [ ] Confirm no sensitive data exposed
- [ ] Backup current production rules
- [ ] Notify team of deployment
- [ ] Have rollback plan ready

### After Deploying to Production:

- [ ] Verify deployment in Firebase Console
- [ ] Test login flow
- [ ] Test project creation
- [ ] Test feedback submission
- [ ] Monitor for errors (first 30 minutes)
- [ ] Check denied requests count
- [ ] Verify app functionality
- [ ] Document any issues

## Version Control

Add to `.gitignore`:
```gitignore
# Keep source rules in git
# firestore.rules.dev
# firestore.rules.prod

# Ignore working file (generated by scripts)
firestore.rules

# Ignore Firebase cache
.firebase/
```

Keep `firestore.rules.dev` and `firestore.rules.prod` in version control.
Let scripts generate `firestore.rules` during deployment.

## Support Resources

- **Firebase Console:** https://console.firebase.google.com
- **Firestore Rules Reference:** https://firebase.google.com/docs/firestore/security/rules-structure
- **Rules Playground:** Use Firebase Console Simulator
- **Your Rules Files:**
  - Development: `firestore.rules.dev`
  - Production: `firestore.rules.prod`

## Quick Reference Commands

```bash
# List projects
firebase projects:list

# Switch to dev
firebase use dev

# Switch to prod
firebase use prod

# Check current project
firebase use

# Deploy rules only (dev)
npm run deploy:rules:dev

# Deploy rules only (prod)
npm run deploy:rules:prod

# View deployment history
firebase deploy:history

# Test rules locally
firebase emulators:start --only firestore
```

## Emergency Contacts

If you encounter critical issues:
1. Rollback immediately using Firebase Console
2. Check GitHub issues
3. Review Firebase status page
4. Contact Firebase Support (if on paid plan)

---

**Remember:** Always deploy to `Instaspec-dev` first and test thoroughly before deploying to `InstaSpec-DHW`!
