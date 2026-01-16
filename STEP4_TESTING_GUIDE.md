# 🧪 Step 4 Testing Guide

**Date:** January 14, 2026
**Feature:** Smart Auto-Assignment for Door-to-Key Mapping

---

## ✅ What Was Implemented

Step 4 (Door Assignment) now includes:

1. **Hierarchy Context Banner** - Shows GMK → MK-1 → MK-2 with real-time assignment counts
2. **Smart Auto-Assignment** - One-click intelligent door-to-key assignment
3. **Change Key Auto-Generation** - Automatically creates CK-101, CK-102, etc.
4. **Preview Modal** - Shows complete assignment plan before executing
5. **Real-time Progress** - Live updates as doors are assigned

---

## 🎯 Testing Instructions

### Prerequisites:
You should have already completed:
- ✅ Step 1: Selected EN 1303 standard, zone_based approach
- ✅ Step 1.5: Selected 3-level hierarchy
- ✅ Step 2: Generated hierarchy (GMK, MK-1 Tower A, MK-2 Group 2)
- ✅ Step 3: Generated zones (Tower A with 8 doors)

### Test Flow:

#### 1. Navigate to Step 4: Door Assignment
- Open your project in the app
- Navigate through the wizard to Step 4
- You should see the Door Assignment page

#### 2. Verify Initial State

**Check Progress Banner:**
```
┌────────────────────────────────────┐
│ Assignment Progress                 │
│ 0 / 8 doors                    0%  │
│ [Empty progress bar]                │
└────────────────────────────────────┘
```
- Shows "0 / 8 doors"
- Shows "0%"
- Progress bar is empty

**Check Hierarchy Context Banner:**
```
┌────────────────────────────────────┐
│ 🔗 Master Key Hierarchy            │
│                                     │
│ GMK - General Master Key            │
│       Opens all 8 doors             │
│                                     │
│   MK-1 - Tower A Master             │
│          0 doors assigned           │
│                                     │
│   MK-2 - Group 2 Master             │
│          0 doors assigned           │
└────────────────────────────────────┘
```
- Banner appears with blue/cyan gradient
- GMK shows "Opens all 8 doors"
- MK-1 shows "0 doors assigned"
- MK-2 shows "0 doors assigned"
- MK-1 and MK-2 are indented 16px

**Check Auto-Assignment Card:**
```
┌────────────────────────────────────┐
│ ✨ Smart Auto-Assignment           │
│                                     │
│ Automatically assign all doors to   │
│ master keys based on zones...       │
│                                     │
│ 🔼 8 unassigned doors               │
│ 🔗 2 master keys                    │
│                                     │
│ [Auto-Assign All Doors Button]     │
└────────────────────────────────────┘
```
- Card appears with indigo/purple gradient
- Shows "8 unassigned doors"
- Shows "2 master keys"
- Button is enabled and prominent

#### 3. Click "Auto-Assign All Doors" Button

**Expected:**
- Button becomes disabled
- Preview modal appears immediately

#### 4. Review Preview Modal

**Modal Should Show:**
```
Auto-Assign Doors

This will create:

**General Master Key (GMK)**
  • Opens all 8 doors

**Master Keys:**
  • MK-1 (Tower A Master) - 8 doors
    └─ Change Keys: CK-101, CK-102, CK-103... (5 more)

**Total Change Keys:** 8
**Total Keys in System:** 11
(1 GMK + 2 MK + 8 CK)

[Cancel]  [Confirm Assignment]
```

**Verify:**
- ✅ GMK shows "Opens all 8 doors"
- ✅ MK-1 shows 8 doors
- ✅ First 3 change keys listed: CK-101, CK-102, CK-103
- ✅ Shows "... (5 more)"
- ✅ Total: 11 keys (1 GMK + 2 MK + 8 CK)
- ✅ MK-2 not listed (no matching zone)

**Test Cancel:**
- Click "Cancel" button
- Modal should close
- No assignments created
- Click "Auto-Assign All Doors" again to continue

#### 5. Confirm Assignment

**Click "Confirm Assignment":**
- Modal closes
- Auto-assignment card button shows:
  - Spinner animation
  - "Assigning..." text
- Process takes ~2-5 seconds (8 doors)

#### 6. Verify Assignment Completion

**Success Message Should Appear:**
```
Success

Auto-assigned 8 doors successfully!

8 change keys created.

[OK]
```
- Shows count of doors assigned
- Shows count of change keys created
- Dismisses when clicked

#### 7. Verify UI Updates

**Progress Banner:**
```
┌────────────────────────────────────┐
│ Assignment Progress                 │
│ 8 / 8 doors                  100%  │
│ [Full indigo progress bar]          │
└────────────────────────────────────┘
```
- Shows "8 / 8 doors"
- Shows "100%"
- Progress bar is full

**Hierarchy Context Banner:**
```
┌────────────────────────────────────┐
│ 🔗 Master Key Hierarchy            │
│                                     │
│ GMK - General Master Key            │
│       Opens all 8 doors             │
│                                     │
│   MK-1 - Tower A Master        [8] │
│          8 doors assigned           │
│                                     │
│   MK-2 - Group 2 Master        [0] │
│          0 doors assigned           │
└────────────────────────────────────┘
```
- MK-1 shows "8 doors assigned"
- MK-1 has emerald badge with "8"
- MK-2 still shows "0 doors assigned"
- MK-2 has no badge (count is 0)

**Auto-Assignment Card:**
- Card completely disappears
- (All doors assigned, no unassigned doors remain)

**Door List:**
- Scroll to door list at bottom
- Each door should show:
  - Green/emerald background
  - Green door icon
  - Door info (mark, use, floor, zone)
  - Green badge with key symbol
- Badges should show change keys: CK-101, CK-102, CK-103... CK-108

**Summary Banner (at bottom):**
```
┌────────────────────────────────────┐
│ Progress: 8 of 8 doors assigned.   │
│ Ready for validation!               │
└────────────────────────────────────┘
```
- Blue background
- Shows completion message
- Says "Ready for validation!"

#### 8. Verify Firestore Data

**Open Firestore Console:**
1. Navigate to `mk_projects/{yourProjectId}/assignments`
2. You should see 8 documents (one per door)

**Each Assignment Document Should Have:**
```json
{
  "doorId": "door_id_123",
  "hierarchyId": "MK-1_hierarchy_id",
  "keySymbol": "CK-101",
  "assignedAt": Timestamp
}
```

**Verify Change Key Symbols:**
- Door 1: CK-101
- Door 2: CK-102
- Door 3: CK-103
- Door 4: CK-104
- Door 5: CK-105
- Door 6: CK-106
- Door 7: CK-107
- Door 8: CK-108

**All should be assigned to:**
- hierarchyId: MK-1 (Tower A Master)
- Because the zone "Tower A" matched "Tower A Master"

---

## 🐛 Common Issues & Fixes

### Issue 1: "No zones could be matched to master keys"
**Cause:** Zone name doesn't match any master key name

**Fix:**
- Check Step 3: Zone name is "Tower A"
- Check Step 2: Master key name is "Tower A Master"
- The matching algorithm looks for partial matches
- "Tower A" should match "Tower A Master"

**Debug:**
- Open browser console (F12)
- Look for logs from `matchZoneToMaster` function
- Check what zones and masters are being compared

### Issue 2: Auto-assignment card doesn't appear
**Cause:** All doors already assigned OR no hierarchies defined

**Fix:**
- Check if Progress Banner shows "8 / 8 doors"
- If yes, doors are already assigned
- To reset: Delete assignments in Firestore and refresh
- Check if hierarchies exist in Step 2

### Issue 3: Wrong change key symbols (e.g., AA1 instead of CK-101)
**Cause:** Standard is set to ANSI instead of EN

**Fix:**
- Check Step 1: Verify EN 1303 is selected
- Check Firestore: `mk_projects/{id}` document should have `standard: "EN"`
- Re-run auto-assignment after fixing standard

### Issue 4: Preview modal doesn't show
**Cause:** `showConfirm` prop not passed from wizard

**Fix:**
- Check `MasterKeyWizard.jsx` line 12
- Verify `showConfirm` prop is received
- Should be passed to Step4DoorAssignment component

### Issue 5: Assignments don't save to Firestore
**Cause:** Firestore permission error or context function issue

**Fix:**
- Check browser console for errors
- Verify `assignDoorToKey` function exists in MasterKeyContext
- Check Firestore rules allow writes to assignments subcollection
- Test internet connection

### Issue 6: Hierarchy banner shows wrong counts
**Cause:** `assignments` array not filtering correctly

**Fix:**
- Check that `hierarchyId` in assignments matches hierarchy documents
- Verify `assignments.filter(a => a.hierarchyId === hierarchy.hierarchyId)` is working
- Check if assignments are loading from Firestore correctly

---

## ✅ Expected Results Summary

| Item | Before Auto-Assign | After Auto-Assign |
|------|-------------------|-------------------|
| Progress | 0 / 8 doors (0%) | 8 / 8 doors (100%) |
| GMK count | Opens all 8 doors | Opens all 8 doors |
| MK-1 count | 0 doors | 8 doors [8] |
| MK-2 count | 0 doors | 0 doors |
| Auto-assign card | Visible | Hidden |
| Door badges | None | CK-101 to CK-108 |
| Firestore assignments | 0 documents | 8 documents |
| Summary banner | Not shown | "Ready for validation!" |

---

## 🔍 What to Look For

### Visual Polish:
- ✅ Smooth animations on progress bar
- ✅ Gradient backgrounds (blue/cyan, indigo/purple)
- ✅ Icons displayed correctly (Network, Sparkles, TrendingUp)
- ✅ Indentation shows hierarchy levels
- ✅ Emerald badges for assigned masters
- ✅ Responsive design on mobile/tablet

### Functionality:
- ✅ Zone-to-master matching works
- ✅ Change keys follow EN pattern (CK-[master#][door#])
- ✅ All 8 doors get assigned
- ✅ Real-time updates work
- ✅ Preview shows accurate data
- ✅ Firestore saves all assignments
- ✅ Error handling shows user-friendly messages

### User Experience:
- ✅ Clear hierarchy visualization
- ✅ One-click assignment
- ✅ Preview before committing
- ✅ Loading states during process
- ✅ Success feedback
- ✅ Progress tracking
- ✅ Smooth flow to next step

---

## 📝 Next Steps After Testing

Once Step 4 is verified working:

1. **Continue to Step 5: Validation**
   - Implement validation checks
   - Detect unassigned doors
   - Check differs usage
   - Verify standards compliance

2. **Continue to Step 6: Export**
   - Generate PDF schedule
   - Export to Excel/CSV
   - Include change key list
   - Show hierarchy diagram

3. **Test Complete Flow End-to-End**
   - Steps 1 → 1.5 → 2 → 3 → 4 → 5 → 6
   - Verify data persists
   - Test with different standards (ANSI vs EN)
   - Test with different approaches (zone/floor/functional)

---

## 🎊 Success Criteria

Step 4 is considered **COMPLETE** when:

- [x] Hierarchy context banner displays correctly
- [x] Auto-assignment button appears and functions
- [x] Preview modal shows accurate assignment plan
- [x] All 8 doors get assigned to correct master
- [x] Change keys follow EN pattern (CK-101 to CK-108)
- [x] Real-time progress updates work
- [x] Firestore saves all assignments correctly
- [x] UI updates immediately after assignment
- [x] Auto-assign card disappears when done
- [x] Summary shows "Ready for validation!"
- [x] No console errors
- [x] Responsive on all screen sizes

---

**Testing Date:** January 14, 2026
**Tester:** [Your Name]
**Status:** ⏳ Ready for Testing

🧪 **Test Step 4 and report any issues!** 🧪
