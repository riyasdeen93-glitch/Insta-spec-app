# App.jsx Changes for Phase 2

## Quick Reference Guide

### **Change 1: Add Imports (Top of File, around line 8)**

**FIND:**
```javascript
import MasterKeyToggle from "./features/masterkey/components/shared/MasterKeyToggle";
```

**REPLACE WITH:**
```javascript
import { MasterKeyProvider } from "./features/masterkey/context/MasterKeyContext";
import MasterKeyToggleWithContext from "./features/masterkey/components/shared/MasterKeyToggleWithContext";
```

---

### **Change 2: Replace Toggle Component (around line 4886)**

**FIND:**
```javascript
{/* Master Key System Toggle */}
<MasterKeyToggle
  key={`mk-toggle-${currentId}-${projects.find(p => p.id === currentId)?.mkSystemEnabled}`}
  enabled={Boolean(projects.find(p => p.id === currentId)?.mkSystemEnabled)}
  onChange={async (enabled) => {
    console.log('App.jsx onChange called with:', enabled);
    const updated = projects.map(p =>
      p.id === currentId
        ? { ...p, mkSystemEnabled: enabled, mkSystemStatus: enabled ? 'not_started' : null }
        : p
    );
    console.log('Updated project:', updated.find(p => p.id === currentId)?.mkSystemEnabled);
    setProjects(updated);

    // Save immediately
    if (user?.email) {
      const current = updated.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  }}
  facilityType={projects.find(p => p.id === currentId)?.type || proj.type}
  onApproachChange={async (approach) => {
    const updated = projects.map(p =>
      p.id === currentId
        ? { ...p, mkApproach: approach }
        : p
    );
    setProjects(updated);

    // Save immediately
    if (user?.email) {
      const current = updated.find((p) => p.id === currentId);
      if (current) {
        await saveProjectForUser(user.email, current);
      }
    }
  }}
/>
```

**REPLACE WITH:**
```javascript
{/* Master Key System Toggle */}
<MasterKeyToggleWithContext
  facilityType={proj.type}
/>
```

---

### **Change 3: Wrap Steps with Provider (THIS IS THE KEY CHANGE)**

**OPTION A: If you want MK system available in all steps**

Find where steps are rendered (around line 4613) and wrap ALL steps:

**FIND:**
```javascript
{/* Step 0: Setup */}
{step === 0 && (() => {
  const proj = getProj();
  // ... Step 0 content
})()}

{/* Step 1: Door Schedule */}
{step === 1 && (
  // ... Step 1 content
)}

// ... other steps ...
```

**WRAP WITH:**
```javascript
{currentId && (
  <MasterKeyProvider projectId={currentId}>
    {/* Step 0: Setup */}
    {step === 0 && (() => {
      const proj = getProj();
      // ... Step 0 content
    })()}

    {/* Step 1: Door Schedule */}
    {step === 1 && (
      // ... Step 1 content
    )}

    // ... other steps ...
  </MasterKeyProvider>
)}
```

**OPTION B: If you only want MK system in Step 0 (simpler for now)**

Just wrap Step 0:

**FIND:**
```javascript
{/* Step 0: Setup */}
{step === 0 && (() => {
  const proj = getProj();
  // ... Step 0 content
})()}
```

**WRAP WITH:**
```javascript
{/* Step 0: Setup */}
{step === 0 && currentId && (
  <MasterKeyProvider projectId={currentId}>
    {(() => {
      const proj = getProj();
      // ... Step 0 content (keep everything the same)
    })()}
  </MasterKeyProvider>
)}
```

---

## Summary of Changes

**Total Lines Changed:** ~60 lines
**Files Modified:** 1 file (App.jsx)
**Risk Level:** LOW (only affects MK toggle, doesn't touch existing features)

**Benefits:**
1. ✅ Fixes toggle state issue
2. ✅ Cleaner code (no manual state management)
3. ✅ Real-time Firestore sync
4. ✅ Automatic persistence
5. ✅ Ready for Phase 3 (wizard & designer)

---

## Need Help?

If you'd like, I can make these changes for you! Just say:

**"Please update App.jsx with Phase 2 changes"**

And I'll apply all three changes automatically.

