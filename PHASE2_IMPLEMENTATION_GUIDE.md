# 🚀 PHASE 2: CONTEXT PROVIDER & CLOUD FUNCTIONS

## Status: ⚙️ **IN PROGRESS**

**Started:** January 12, 2026

---

## 📦 What We're Building

### Phase 2 Goals:
1. ✅ Create MasterKeyContext provider (COMPLETE)
2. ✅ Create context-aware toggle component (COMPLETE)
3. ⏳ Set up Firebase Cloud Functions
4. ⏳ Implement core Cloud Functions
5. ⏳ Update App.jsx to use Context
6. ⏳ **FIX THE TOGGLE STATE ISSUE**
7. ⏳ Test everything works

---

## ✅ What's Been Created

### 1. **MasterKeyContext.jsx**
**Location:** `src/features/masterkey/context/MasterKeyContext.jsx`

**Features:**
- Real-time Firestore listeners for project MK fields
- `toggleMKSystem(enabled)` - Toggle MK system ON/OFF
- `updateMKApproach(approach)` - Change approach selection
- Provides `mkSystemEnabled`, `mkApproach` state
- Automatic state sync with Firestore
- Error handling and loading states

**Key Functions:**
```javascript
const {
  mkSystemEnabled,      // Current toggle state
  mkApproach,          // Selected approach
  toggleMKSystem,      // Function to toggle
  updateMKApproach,    // Function to change approach
  loading,             // Loading state
  error                // Error messages
} = useMasterKey();
```

### 2. **MasterKeyToggleWithContext.jsx**
**Location:** `src/features/masterkey/components/shared/MasterKeyToggleWithContext.jsx`

**Features:**
- Uses `useMasterKey()` hook
- Directly reads from Context state
- Automatically updates when Firestore changes
- **This will fix the toggle state issue!**

---

## 🔧 How to Complete Phase 2

### **Step 1: Wrap App with MasterKeyProvider**

You need to update `App.jsx` to wrap the project content with the MasterKeyProvider.

**Find this in App.jsx (around line 4613):**
```javascript
{step === 0 && (() => {
  const proj = getProj();
  // ... rest of Step 0
})()}
```

**Wrap the entire app content (all steps) with MasterKeyProvider:**
```javascript
{currentId && (
  <MasterKeyProvider projectId={currentId}>
    {/* All your steps go here */}
    {step === 0 && (() => {
      // Step 0 content
    })()}

    {step === 1 && (
      // Step 1 content
    )}

    {/* ... other steps ... */}
  </MasterKeyProvider>
)}
```

### **Step 2: Replace Old Toggle with Context Toggle**

**In App.jsx, find the current MasterKeyToggle (around line 4886):**
```javascript
<MasterKeyToggle
  key={`mk-toggle-${currentId}-${projects.find(p => p.id === currentId)?.mkSystemEnabled}`}
  enabled={Boolean(projects.find(p => p.id === currentId)?.mkSystemEnabled)}
  onChange={async (enabled) => { ... }}
  facilityType={projects.find(p => p.id === currentId)?.type || proj.type}
  onApproachChange={async (approach) => { ... }}
/>
```

**Replace it with:**
```javascript
<MasterKeyToggleWithContext
  facilityType={proj.type}
/>
```

**That's it!** The context handles all state management.

### **Step 3: Add Imports**

**At the top of App.jsx, add:**
```javascript
import { MasterKeyProvider } from "./features/masterkey/context/MasterKeyContext";
import MasterKeyToggleWithContext from "./features/masterkey/components/shared/MasterKeyToggleWithContext";
```

---

## 🐛 Why This Fixes The Toggle Issue

### **The Problem:**
1. Step 0 uses an IIFE that captures `proj` at render time
2. When `setProjects()` is called, `proj` variable doesn't update
3. Even though Firestore state updates, the component doesn't see it

### **The Solution:**
1. **MasterKeyContext** listens directly to Firestore
2. **Context state** updates independently of `projects` array
3. **Real-time listener** ensures UI always reflects database state
4. **No captured variables** - context always has latest state

### **Flow:**
```
User clicks toggle
  → toggleMKSystem() called
  → Firestore `projects/{id}` updated
  → onSnapshot() listener fires
  → Context state updates
  → Component re-renders with new state
  → Toggle shows "ON" ✅
```

---

## 🧪 Testing Instructions

Once you've made the changes above:

### **Test 1: Toggle ON**
1. Open Step 0
2. Click Master Key toggle
3. Should see:
   - Console: "toggleMKSystem called with: true"
   - Console: "MK system toggled successfully"
   - Toggle turns BLUE
   - Label changes to "MASTER KEY ON"
   - Green success box appears

### **Test 2: Approach Selection**
1. With toggle ON
2. Click each radio button
3. Should see:
   - Console: "updateMKApproach called with: [approach]"
   - Radio button selection updates immediately

### **Test 3: Toggle OFF**
1. Click toggle again
2. Should see:
   - Toggle turns GRAY
   - Label changes to "MASTER KEY OFF"
   - Blue info box appears
   - Approach selections hidden

### **Test 4: Persistence**
1. Toggle ON, select an approach
2. Click "Save & Continue"
3. Go to Step 1 (Door Schedule)
4. Click browser back
5. Should see:
   - Toggle still ON
   - Approach still selected
   - State persists

---

## 📁 Files Created in Phase 2

### ✅ Created:
1. `src/features/masterkey/context/MasterKeyContext.jsx` (268 lines)
2. `src/features/masterkey/components/shared/MasterKeyToggleWithContext.jsx` (187 lines)
3. `PHASE2_IMPLEMENTATION_GUIDE.md` (this file)

### 🔄 To Be Modified:
1. `src/App.jsx` - Add MasterKeyProvider wrapper + use new toggle

---

## 🚀 Next Steps (After Toggle Works)

Once the toggle works correctly, we'll continue Phase 2:

### **Part 2: Firebase Cloud Functions**

1. **Initialize Firebase Functions:**
   ```bash
   firebase init functions
   ```

2. **Create Functions:**
   - `enableMKSystem` - Create MK project document
   - `deleteMKSystem` - Delete MK project with cascade
   - `getHierarchyTree` - Build hierarchy tree structure

3. **Deploy Functions:**
   ```bash
   cd functions
   firebase deploy --only functions
   ```

4. **Test Functions:**
   - Enable MK system
   - Check Firestore console
   - Verify mk_projects document created

---

## ⚠️ Important Notes

### **Firestore Rules Needed:**
Before testing, ensure your `firestore.rules` allows reading/writing to `projects`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Environment Variables:**
Make sure your `.env` file has Firebase config:
```
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=...
VITE_FB_PROJECT_ID=...
VITE_FB_STORAGE_BUCKET=...
VITE_FB_MESSAGING_SENDER_ID=...
VITE_FB_APP_ID=...
```

---

## 🆘 Troubleshooting

### Issue: "useMasterKey must be used within MasterKeyProvider"
**Solution:** Make sure MasterKeyProvider wraps your component tree

### Issue: Firestore permission denied
**Solution:** Check Firestore security rules and user authentication

### Issue: "db is not defined"
**Solution:** Check import path: `import { db } from '../../../firebase'`

### Issue: Toggle still doesn't work
**Solution:**
1. Check browser console for errors
2. Verify MasterKeyProvider has correct `projectId` prop
3. Check Firestore console to see if data is updating

---

## 📞 Ready to Continue?

**To proceed:**
1. Make the changes to App.jsx as described above
2. Test the toggle works
3. Report back if it works! ✅
4. Then we'll continue with Cloud Functions

---

## 🎉 Success Criteria

Phase 2 is complete when:
- [ ] MasterKeyContext provider created
- [ ] MasterKeyToggleWithContext component created
- [ ] App.jsx updated to use Context
- [ ] **Toggle changes to "ON" when clicked** ✅
- [ ] Toggle state persists across navigation
- [ ] Approach selection works
- [ ] Firebase Cloud Functions initialized
- [ ] Core Cloud Functions deployed
- [ ] All tests passing

---

**Current Status:** ⏳ **Waiting for App.jsx updates**

**Next Action:** Update App.jsx to use MasterKeyProvider + MasterKeyToggleWithContext

