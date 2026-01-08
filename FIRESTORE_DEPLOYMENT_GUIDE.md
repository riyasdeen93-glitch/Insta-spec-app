# Firestore Security Rules Deployment Guide

## Important Security Notice

Your app currently uses a **custom authentication system** stored in localStorage. The security rules created in `firestore.rules` expect **Firebase Authentication** to be implemented.

## Current Situation

- **Your app**: Uses custom beta codes and localStorage for authentication
- **Security rules**: Require Firebase Authentication (`request.auth`)
- **Result**: Rules won't work without implementing Firebase Auth

## Production Deployment Options

### Option 1: Implement Firebase Authentication (Recommended)

#### Why This is Recommended:
- Industry-standard security
- Proper token-based authentication
- Built-in security features (rate limiting, etc.)
- Works with the security rules provided

#### Steps to Implement:

1. **Enable Firebase Authentication**
   ```bash
   # Go to Firebase Console
   # Authentication > Get Started > Enable Email/Password
   ```

2. **Update your code to use Firebase Auth**
   - Replace custom auth with Firebase Authentication
   - Use `signInWithEmailAndPassword` or custom tokens
   - Keep beta user validation in Firestore
   - Use Firebase Auth for security, betaUsers collection for app logic

3. **Deploy the security rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Modified Rules for Custom Auth (Less Secure)

If you want to keep your current custom authentication system, you'll need different security rules that don't rely on `request.auth`. This is **not recommended for production** as it's much harder to secure properly.

### Option 3: Hybrid Approach (Balanced)

1. Keep your beta user management system
2. Add Firebase Authentication for database security
3. Use Firebase Auth tokens to verify users in security rules
4. Continue using betaUsers collection for app-level permissions

## Deploying Security Rules

### Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase (if not done)**
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Choose `firestore.rules` as your rules file
   - Choose `firestore.indexes.json` for indexes

### Deploy Rules

```bash
# Deploy only firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

### Test Rules Before Deploying

```bash
# Use Firebase Emulator to test locally
firebase emulators:start --only firestore

# In another terminal, run your tests
npm test
```

## Security Best Practices

### 1. Never Expose Sensitive Data
- Don't store API keys or secrets in Firestore
- Keep `.env` files out of version control (already in `.gitignore`)

### 2. Validate All Input
- The rules validate email format, string lengths, and data types
- Add client-side validation as a first line of defense

### 3. Monitor Usage
- Enable Firebase Security Rules monitoring in console
- Set up alerts for unusual activity
- Review logs regularly

### 4. Rate Limiting
Consider implementing rate limiting:
```javascript
// In your client code
import { getFunctions, httpsCallable } from 'firebase/functions';

// Use Cloud Functions with rate limiting for sensitive operations
```

### 5. Regular Audits
- Review security rules quarterly
- Check for unauthorized access patterns
- Update rules as your app evolves

## Testing Security Rules

Create a `firestore.rules.test.js` file:

```javascript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';

// Test that unauthenticated users cannot read
test('Deny unauthenticated reads', async () => {
  const db = getFirestore(getUnauthenticatedContext());
  await assertFails(db.collection('projects').get());
});

// Test that users can read their own projects
test('Allow users to read own projects', async () => {
  const db = getFirestore(getAuthenticatedContext('user@example.com'));
  await assertSucceeds(
    db.collection('projects')
      .where('ownerEmail', '==', 'user@example.com')
      .get()
  );
});
```

## Current Rules Summary

The `firestore.rules` file includes:

### Collections Protected:
1. **betaUsers** - Beta user management (admin-only writes, self-reads)
2. **projects** - User projects (owner-only access)
3. **feedback** - User feedback (write-once, admin-read)
4. **betaLoginLogs** - Login tracking (write-only logs)
5. **betaMetadata** - System metadata (admin access)
6. **betaUsage** - Download tracking (self-access)

### Security Features:
- Authentication required for all operations
- Email validation
- Data type validation
- Size limits (messages: 5000 chars, images: 5MB)
- Ownership checks
- Admin role verification
- Immutable logs (no updates/deletes)
- Deny-by-default for unlisted collections

## Troubleshooting

### Rules deployed but not working?
1. Check Firebase Console > Firestore > Rules tab
2. Verify the rules were actually deployed
3. Clear browser cache
4. Check browser console for specific rule violations

### Getting permission denied errors?
1. Verify user is authenticated with Firebase Auth
2. Check that `request.auth.token.email` matches expected email
3. Verify betaUsers document exists with correct structure
4. Check if beta user is expired

### Need to rollback?
```bash
# View deployment history
firebase deploy:history

# Rollback to previous version (if needed)
# This must be done from Firebase Console
```

## Migration Checklist

If implementing Firebase Authentication:

- [ ] Enable Email/Password auth in Firebase Console
- [ ] Install Firebase Auth SDK
- [ ] Create auth service wrapper
- [ ] Update login flow to use Firebase Auth
- [ ] Keep betaUsers collection for app permissions
- [ ] Update security rules if needed
- [ ] Test authentication flow
- [ ] Test all database operations
- [ ] Deploy to production
- [ ] Monitor for issues

## Support

For issues:
1. Check Firebase Console > Firestore > Rules for errors
2. Review Firebase documentation: https://firebase.google.com/docs/firestore/security/get-started
3. Test locally with Firebase Emulator
4. Check your application logs

## Next Steps

1. **Decide on authentication approach**
2. **Test rules locally with Firebase Emulator**
3. **Deploy to a test environment first**
4. **Monitor closely after production deployment**
5. **Set up alerts for security violations**
