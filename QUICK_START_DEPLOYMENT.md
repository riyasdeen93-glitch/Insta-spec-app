# Quick Start: Deploy Firestore Rules

## TL;DR - Deploy Now

### First Time Setup (One-time only)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (select both projects when prompted)
firebase init firestore
```

### Deploy to Development (Instaspec-dev)

```bash
npm run deploy:rules:dev
```

### Deploy to Production (InstaSpec-DHW)

```bash
npm run deploy:rules:prod
```

That's it! 🚀

---

## What Just Happened?

### Development Deployment
- Deployed **permissive rules** to `Instaspec-dev`
- Allows easy testing on localhost
- Low security (development only)

### Production Deployment
- Deployed **secure rules** to `InstaSpec-DHW`
- Validates beta users
- Checks expiration dates
- Enforces data ownership
- Protects admin operations

---

## Verify Deployment

### 1. Check Firebase Console

**Development:**
- Go to: https://console.firebase.google.com
- Select: `Instaspec-dev`
- Navigate: Firestore Database → Rules
- Should see: Permissive rules with "WARNING" comments

**Production:**
- Select: `InstaSpec-DHW`
- Navigate: Firestore Database → Rules
- Should see: Secure rules with validation functions

### 2. Test Your App

**Development (localhost):**
```bash
npm run dev
# App should work as before
```

**Production:**
- Visit your live site
- Test login
- Create a project
- Submit feedback
- Everything should work!

---

## Important Security Notes

### ✅ What's Protected (Production)

1. **Beta User Validation**
   - Users must exist in `betaUsers` collection
   - Expired users cannot perform operations

2. **Admin Protection**
   - Only `admin@techarix.com` can:
     - Create/delete beta users
     - Set admin privileges
     - Read all feedback

3. **Data Validation**
   - Email format checked
   - Required fields enforced
   - Size limits:
     - Messages: 5000 characters
     - Images: 5MB

4. **Ownership**
   - Users can only modify their own projects
   - Projects linked to valid beta users

5. **Immutable Data**
   - Feedback cannot be edited/deleted
   - Login logs are permanent

### ⚠️ What to Watch

1. **Don't Mix Rules**
   - NEVER deploy dev rules to production
   - Use the npm scripts (they're safe)

2. **Test First**
   - Always deploy to dev first
   - Test thoroughly
   - Then deploy to prod

3. **Monitor Usage**
   - Check Firebase Console regularly
   - Look for denied requests
   - Review access patterns

---

## Troubleshooting

### "Permission Denied" Error

**Check:**
1. Does user exist in `betaUsers` collection?
2. Is `expiresAt` null or in the future?
3. Is email lowercase in database?
4. Are all required fields present?

**Fix:**
```javascript
// In Firebase Console, check betaUsers/{email}
// Ensure:
{
  email: "user@example.com",  // lowercase
  code: "BETA-XXXX-XXXX",
  plan: "beta_tester",
  isAdmin: false,
  expiresAt: null,  // or future timestamp
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### Rules Not Working

1. **Clear browser cache**
2. **Wait 1-2 minutes** (rules need to propagate)
3. **Check Firebase Console** (Rules tab)
4. **Verify deployment succeeded**

### Need to Rollback

**Emergency (use Firebase Console):**
1. Go to Firestore → Rules → History
2. Select previous version
3. Click "Publish"

**Proper way:**
```bash
# Revert changes
git checkout HEAD~1 firestore.rules.prod

# Redeploy
npm run deploy:rules:prod
```

---

## File Reference

Your project now has:

| File | Purpose |
|------|---------|
| `firestore.rules.dev` | Development rules (permissive) |
| `firestore.rules.prod` | Production rules (secure) |
| `firestore.rules` | Working file (auto-generated) |
| `.firebaserc` | Project configuration |
| `DEPLOYMENT_GUIDE.md` | Full deployment documentation |
| `QUICK_START_DEPLOYMENT.md` | This file |

---

## NPM Scripts Available

```bash
# Deploy rules to development
npm run deploy:rules:dev

# Deploy rules to production
npm run deploy:rules:prod

# Switch to dev project
npm run firebase:dev

# Switch to prod project
npm run firebase:prod
```

---

## Common Tasks

### Check Current Firebase Project
```bash
firebase use
```

### View Projects List
```bash
firebase projects:list
```

### View Deployment History
```bash
firebase deploy:history
```

### Test Rules Locally
```bash
firebase emulators:start --only firestore
```

---

## Production Deployment Checklist

Before running `npm run deploy:rules:prod`:

- [ ] Tested in development first
- [ ] App works on localhost
- [ ] Reviewed rule changes
- [ ] Ready to monitor for issues
- [ ] Have rollback plan

After deployment:

- [ ] Verify in Firebase Console
- [ ] Test login on live site
- [ ] Test project creation
- [ ] Monitor for 30 minutes
- [ ] Check for denied requests

---

## Support

- **Full Guide:** See `DEPLOYMENT_GUIDE.md`
- **Firebase Console:** https://console.firebase.google.com
- **Issues:** Check denied requests in Console

---

## Remember

1. **Always test in dev first** (`npm run deploy:rules:dev`)
2. **Then deploy to prod** (`npm run deploy:rules:prod`)
3. **Monitor after deployment**
4. **Keep calm and carry on** 🚀

Your database is now secure! 🔒
