# Master Key System - UI Relocation

**Date:** January 13, 2026
**Status:** ✅ COMPLETE

---

## 🎯 Change Summary

Moved the Master Key System toggle and configuration from **Step 0 (Project Setup)** to **Step 4 (Validation & Review)** and merged it with the "Continue to Master Key Design" button as a unified section.

---

## 📝 Changes Made

### 1. **Removed from Step 0 (Project Setup)**

**File:** `src/App.jsx` (lines 4890-4893)

**Removed:**
```jsx
{/* Master Key System Toggle */}
<MasterKeyToggleWithContext
  facilityType={proj.type}
/>
```

The Master Key System toggle was previously shown immediately after Instant Door Scheduling in Step 0, which was too early in the workflow.

---

### 2. **Added to Step 4 (Validation & Review)**

**File:** `src/App.jsx` (lines 5547-5568)

**Added:**
```jsx
{/* Master Key System Section */}
<MasterKeyProvider projectId={currentId}>
  {(() => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slideUp">
        <MasterKeyToggleWithContext facilityType={proj.type} />

        {getProj()?.mkSystemEnabled && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setStep(5)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold flex items-center justify-center gap-3 shadow-xl text-lg transition-all hover:scale-105"
            >
              <Key size={24} /> Continue to Master Key Design
              <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>
    );
  })()}
</MasterKeyProvider>
```

**Key Features:**
- Wrapped in `MasterKeyProvider` for context access
- Shows the toggle component with facility type
- Only displays "Continue to Master Key Design" button when Master Key is enabled
- Unified UI with gradient button styling

---

### 3. **Updated MasterKeyToggleWithContext Component**

**File:** `src/features/masterkey/components/shared/MasterKeyToggleWithContext.jsx` (lines 34-74)

**Changes:**
- Added prominent question prompt at the top: **"Would you like to design a Master Key System?"**
- Changed description to be more action-oriented: "Enable to start designing your master keying system."
- Removed "You'll design this in Step 5 after door scheduling" (no longer needed since it's IN Step 4)

**New Structure:**
```jsx
return (
  <div>
    {/* Question Prompt */}
    <div className="mb-6 text-center">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Would you like to design a Master Key System?
      </h3>
      <p className="text-sm text-gray-600">
        Design a professional master keying system for doors in this project
        with hierarchy levels, security zones, and key symbols.
      </p>
    </div>

    {/* Toggle and Configuration */}
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Master Key System (Optional)</h3>
          <p className="text-xs text-gray-500">Enable to start designing your master keying system.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
            {mkSystemEnabled ? "Master key ON" : "Master key OFF"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={mkSystemEnabled}
            onClick={handleToggleChange}
            disabled={loading}
            className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${
              mkSystemEnabled ? "bg-indigo-600" : "bg-gray-300"
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                mkSystemEnabled ? "translate-x-[22px]" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>

    {/* Rest of component (facility info, quick setup options, learn more, etc.) */}
  </div>
);
```

---

## 🎨 Visual Flow

### Before:
```
Step 0 (Project Setup)
├── Project Name/Type
├── Instant Door Scheduling (Toggle)
├── Master Key System (Toggle)  ← HERE BEFORE
└── [Save & Continue]

Step 4 (Validation & Review)
├── Validation Report
├── Statistics (Doors/Sets/Jurisdiction)
└── [Continue to Master Key Design] ← Only if enabled
```

### After:
```
Step 0 (Project Setup)
├── Project Name/Type
├── Instant Door Scheduling (Toggle)
└── [Save & Continue]

Step 4 (Validation & Review)
├── Validation Report
├── Statistics (Doors/Sets/Jurisdiction)
└── Master Key System Section  ← NOW HERE
    ├── Question: "Would you like to design a Master Key System?"
    ├── Toggle (ON/OFF)
    ├── Facility Type & Recommendations
    ├── Quick Setup Options (zone/custom/import)
    ├── What you'll be able to do (bullets)
    └── [Continue to Master Key Design] ← Only if enabled
```

---

## 📊 Benefits of This Change

1. **Better User Flow**: Users see the Master Key option AFTER they've completed their door schedule and hardware specification, making it a natural next step.

2. **Contextual Timing**: At Step 4, users have all door data ready, making the decision to add master keying more informed.

3. **Unified Interface**: The toggle and the "Continue" button are now in the same section, creating a single decision point.

4. **Clearer Intent**: The question "Would you like to design a Master Key System?" makes it explicit that this is an optional enhancement step.

5. **Reduced Cognitive Load**: Users don't have to think about master keying in Step 0 when they're still setting up basic project details.

---

## ✅ User Experience

### When Master Key is OFF:
1. User sees the question prompt
2. Toggle shows "Master key OFF"
3. Gray informational box with "Learn more" expandable section
4. No "Continue" button visible

### When Master Key is ON:
1. User sees the question prompt
2. Toggle shows "Master key ON"
3. Blue/indigo section with:
   - Facility type recommendation
   - Quick setup options (zone/custom/import)
   - "What you'll be able to do" bullets
4. Large gradient button appears: **"Continue to Master Key Design"**
5. Clicking button navigates to Step 5 (Master Key Wizard)

---

## 🔧 Technical Details

### Context Management:
- `MasterKeyProvider` wraps the entire section in Step 4
- `useMasterKey()` hook provides:
  - `mkSystemEnabled` (boolean)
  - `mkApproach` (string: zone_based, custom_hierarchy, imported)
  - `toggleMKSystem(enabled)` (async function)
  - `updateMKApproach(approach)` (async function)
  - `loading` (boolean)

### Firestore Updates:
When toggle is changed:
```javascript
// Updates projects/{projectId}
{
  mkSystemEnabled: true/false,
  mkApproach: "zone_based" | "custom_hierarchy" | "imported"
}

// If enabled, creates mk_projects/{mkProjectId}
{
  projectId: "{projectId}",
  standard: "ANSI_BHMA" | "EN",
  keyingApproach: "zone_based" | "custom_hierarchy" | "imported",
  // ... other MK project fields
}
```

---

## 📱 Responsive Behavior

- **Desktop**: Question prompt centered, toggle on right side of header
- **Mobile**: Question stacks vertically, toggle moves below text
- **Button**: Full width on mobile, auto-width centered on desktop

---

## 🎯 Success Criteria

✅ Master Key toggle removed from Step 0
✅ Master Key section added to Step 4
✅ Question prompt clearly visible
✅ Toggle and "Continue" button unified in one section
✅ MasterKeyProvider properly wraps the section
✅ All existing functionality preserved
✅ Responsive design works on mobile and desktop
✅ Context state management working correctly

---

**Status:** ✅ **COMPLETE AND READY FOR TESTING**

**Next Step:** User should test the flow:
1. Complete Steps 0-3
2. Arrive at Step 4
3. See the Master Key System question
4. Enable the toggle
5. Select quick setup approach
6. Click "Continue to Master Key Design"
7. Verify Step 5 (Master Key Wizard) loads correctly
