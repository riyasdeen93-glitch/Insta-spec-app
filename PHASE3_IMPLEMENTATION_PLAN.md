# Phase 3: Simple Wizard Mode - Implementation Plan

**Date:** January 12, 2026
**Status:** Planning

---

## 🎯 Overview

Phase 3 adds a **6-step Master Key Design Wizard** that appears as **Step 5** in the main application flow. This wizard will only be visible when the Master Key System is enabled in Step 0.

---

## 📊 Current Application Structure

### Existing Steps:
- **Step 0**: Project Setup (includes MK toggle)
- **Step 1**: Door Schedule
- **Step 2**: Hardware Sets
- **Step 3**: Validation & Review
- **Step 4**: *(Reserved for future)*
- **Step 5**: *(NEW - Master Key Design)*

### Navigation Constants:
```javascript
const WIZARD_STEPS = ["Project Setup", "Door Schedule", "Hardware Sets", "Validation & Review"];
const WIZARD_SHORT_LABELS = ["SETUP", "SCHEDULE", "PREVIEW", "GENERATE"];
```

**Update Required:**
```javascript
const WIZARD_STEPS = [
  "Project Setup",
  "Door Schedule",
  "Hardware Sets",
  "Validation & Review",
  "Master Key Design"  // NEW
];
const WIZARD_SHORT_LABELS = [
  "SETUP",
  "SCHEDULE",
  "PREVIEW",
  "GENERATE",
  "MASTER KEY"  // NEW
];
```

---

## 🏗️ Architecture

### Folder Structure:
```
src/features/masterkey/
├── context/
│   └── MasterKeyContext.jsx (✅ Already exists - Phase 2)
├── components/
│   ├── shared/
│   │   ├── MasterKeyToggleWithContext.jsx (✅ Already exists - Phase 2)
│   │   └── WizardNavigation.jsx (NEW)
│   ├── wizard/
│   │   ├── MasterKeyWizard.jsx (NEW - Main container)
│   │   ├── Step1Introduction.jsx (NEW)
│   │   ├── Step2HierarchySetup.jsx (NEW)
│   │   ├── Step3ZoneDefinition.jsx (NEW)
│   │   ├── Step4DoorAssignment.jsx (NEW)
│   │   ├── Step5Validation.jsx (NEW)
│   │   └── Step6Export.jsx (NEW)
│   └── advanced/ (Phase 4 - Designer Mode)
└── hooks/
    ├── useMasterKeyWizard.js (NEW)
    └── useKeyHierarchy.js (NEW)
```

---

## 📋 Step 5 Sub-Wizard Flow

### Step 5.1: Introduction
**Purpose:** Welcome screen with quick setup options

**UI Elements:**
- Welcome message explaining MK system
- Facility type reminder (from Step 0)
- Keying approach selection (zone_based / floor_based / functional)
- Quick stats: Total doors from Step 1
- Continue button → Step 5.2

**Data Operations:**
- Read: mkProject (keyingApproach, statistics)
- Update: keyingApproach (if changed)

---

### Step 5.2: Hierarchy Setup
**Purpose:** Define the key hierarchy levels (GMK, MK, SMK, Change Keys)

**UI Elements:**
- Visual hierarchy tree diagram
- Default hierarchy based on facility type:
  - **Education**: GMK → MK → SMK → Change Key (4 levels)
  - **Office**: MK → SMK → Change Key (3 levels)
  - **Healthcare**: GMK → MK → Floor Master → Zone Key → Change Key (5 levels)
- Add/remove levels
- Edit key symbols (A, AA, AAA, etc.)
- Key bitting depth selector (6-7 pins, depths 1-7)
- Back / Continue buttons

**Data Operations:**
- Create: hierarchies subcollection documents
  ```javascript
  {
    level: 1,
    levelName: "Grand Master Key",
    keySymbol: "A",
    parentHierarchyId: null,
    childCount: 0,
    bitting: "123456", // Auto-generated
    createdAt: timestamp
  }
  ```

**Firestore:**
```
mk_projects/{mkProjectId}/hierarchies/{hierarchyId}
```

---

### Step 5.3: Zone Definition
**Purpose:** Create zones for zone-based keying (skip if floor_based/functional)

**UI Elements:**
- Zone creation form (name, description, color)
- List of zones
- Visual preview of zones
- Door count per zone (calculated)
- Back / Continue buttons

**Data Operations:**
- Create: zones subcollection
  ```javascript
  {
    zoneName: "Administration Wing",
    zoneDescription: "Main office area",
    zoneColor: "#3B82F6",
    doorCount: 0,
    createdAt: timestamp
  }
  ```
- Create: door_zones junction table
  ```javascript
  {
    zoneId: "zone123",
    doorId: "door456",
    doorNumber: "101",
    createdAt: timestamp
  }
  ```

**Firestore:**
```
mk_projects/{mkProjectId}/zones/{zoneId}
mk_projects/{mkProjectId}/door_zones/{doorZoneId}
```

---

### Step 5.4: Door Assignment
**Purpose:** Assign doors to keys/zones

**UI Elements:**
- Left panel: Door list from Step 1 (sets/{setId}/doors)
- Right panel: Hierarchy tree with drag-drop zones
- Bulk assignment options:
  - "Assign all doors in zone to SMK-A"
  - "Auto-assign by floor"
- Assignment status indicator
- Back / Continue buttons

**Data Operations:**
- Create: assignments subcollection
  ```javascript
  {
    doorId: "door456",
    doorNumber: "101",
    hierarchyId: "hierarchy789",
    keySymbol: "AAA",
    assignedAt: timestamp
  }
  ```
- Update: mk_projects.statistics.keyedDoors (count)

**Firestore:**
```
mk_projects/{mkProjectId}/assignments/{assignmentId}
```

**Real-time Updates:**
- Listen to assignments collection
- Update statistics automatically
- Show progress bar: "15/50 doors keyed"

---

### Step 5.5: Validation
**Purpose:** Check for errors, conflicts, and warnings

**Validation Rules:**
1. **Errors (blocking):**
   - Doors assigned to non-existent hierarchy
   - Key symbol conflicts
   - Bitting conflicts (same bitting at different levels)
   - Exceeds max differs (117,649 for 6-pin, 7-depth)

2. **Warnings (non-blocking):**
   - Unkeyed doors remaining
   - Zones with no doors
   - Single-door zones (inefficient)
   - Cross-keying detected

**UI Elements:**
- Validation summary card:
  - ✅ All checks passed
  - ⚠️ 3 warnings found
  - ❌ 2 errors found
- Expandable error/warning list with "Fix" buttons
- Statistics summary:
  - Total doors: 50
  - Keyed doors: 48
  - Unkeyed: 2
  - Differs used: 85 / 117,649
- Back / Continue buttons

**Data Operations:**
- Read: All assignments, hierarchies, zones
- Calculate: differs used, conflicts, coverage
- Update: mk_projects.statistics
- Create: validation_issues (optional for audit)

---

### Step 5.6: Export
**Purpose:** Generate and download keying schedules

**Export Formats:**
1. **PDF Schedule:**
   - Door-by-door schedule
   - Hierarchy chart
   - Key bitting list

2. **Excel Workbook:**
   - Sheet 1: Door Schedule (Door #, Location, Key Symbol, Bitting)
   - Sheet 2: Hierarchy (Level, Symbol, Parent, Children)
   - Sheet 3: Key Cutting List (Symbol, Bitting, Quantity)

3. **CSV Files:**
   - doors.csv
   - keys.csv
   - hierarchy.csv

**UI Elements:**
- Export format selector (PDF / Excel / CSV)
- Preview panel
- Download button
- Email delivery option
- "Generate Another Export" button
- "Finish" button → Return to Step 3

**Data Operations:**
- Create: exports subcollection
  ```javascript
  {
    format: "PDF",
    fileSize: 245678,
    downloadUrl: "https://storage...",
    generatedAt: timestamp,
    expiresAt: timestamp + 7 days
  }
  ```

**Firestore:**
```
mk_projects/{mkProjectId}/exports/{exportId}
```

---

## 🔧 Context API Integration

### MasterKeyContext Updates:

**New State:**
```javascript
const [wizardStep, setWizardStep] = useState(0); // 0-5 for sub-steps
const [hierarchies, setHierarchies] = useState([]);
const [zones, setZones] = useState([]);
const [assignments, setAssignments] = useState([]);
const [validationIssues, setValidationIssues] = useState([]);
```

**New Functions:**
```javascript
// Hierarchy Management
const createHierarchy = async (hierarchyData) => { ... }
const updateHierarchy = async (hierarchyId, updates) => { ... }
const deleteHierarchy = async (hierarchyId) => { ... }

// Zone Management
const createZone = async (zoneData) => { ... }
const updateZone = async (zoneId, updates) => { ... }
const deleteZone = async (zoneId) => { ... }
const assignDoorToZone = async (doorId, zoneId) => { ... }

// Door Assignment
const assignDoorToKey = async (doorId, hierarchyId) => { ... }
const unassignDoor = async (doorId) => { ... }
const bulkAssignDoors = async (doorIds, hierarchyId) => { ... }

// Validation
const validateMKProject = async () => { ... }
const getValidationSummary = () => { ... }

// Export
const generateExport = async (format) => { ... }
```

**Real-time Listeners:**
```javascript
useEffect(() => {
  // Listen to hierarchies subcollection
  const unsubscribe = onSnapshot(
    collection(db, 'mk_projects', mkProjectId, 'hierarchies'),
    (snapshot) => {
      const hierarchyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHierarchies(hierarchyList);
    }
  );
  return () => unsubscribe();
}, [mkProjectId]);

// Similar listeners for zones, assignments
```

---

## 🎨 UI/UX Design Principles

### Visual Consistency:
- Match existing app styling (TailwindCSS)
- Use Lucide React icons
- Indigo color scheme (primary)
- Emerald for success, Orange for warnings, Red for errors

### Navigation:
- Breadcrumb: Step 5 → Step 5.X
- Progress indicator: "Step 2 of 6"
- Back/Continue buttons at bottom
- "Save & Exit" button (returns to Step 3, saves progress)

### Responsive Design:
- Desktop: Side-by-side panels
- Tablet: Stacked panels
- Mobile: Full-width, vertical scrolling

### Animations:
- Smooth transitions between sub-steps
- Slide-up animations for cards
- Loading spinners for async operations

---

## 📝 Implementation Order

### Phase 3.1: Infrastructure (Days 1-2)
1. ✅ Update WIZARD_STEPS and WIZARD_SHORT_LABELS in App.jsx
2. ✅ Create MasterKeyWizard.jsx container component
3. ✅ Create WizardNavigation.jsx for sub-step navigation
4. ✅ Update MasterKeyContext with new state and functions
5. ✅ Add Step 5 section to App.jsx

### Phase 3.2: Wizard Steps (Days 3-6)
1. ✅ Step1Introduction.jsx
2. ✅ Step2HierarchySetup.jsx
3. ✅ Step3ZoneDefinition.jsx
4. ✅ Step4DoorAssignment.jsx
5. ✅ Step5Validation.jsx
6. ✅ Step6Export.jsx

### Phase 3.3: Testing & Refinement (Days 7-8)
1. ✅ End-to-end testing
2. ✅ Bug fixes
3. ✅ UX improvements
4. ✅ Documentation updates

---

## 🧪 Testing Checklist

### Unit Tests:
- [ ] Context functions (create, update, delete)
- [ ] Validation logic
- [ ] Bitting generation algorithm
- [ ] Export formatting

### Integration Tests:
- [ ] Complete wizard flow (6 steps)
- [ ] Data persistence in Firestore
- [ ] Real-time updates
- [ ] Error handling

### User Acceptance Tests:
- [ ] Education facility (4-level hierarchy)
- [ ] Office building (3-level hierarchy)
- [ ] Healthcare facility (5-level hierarchy)
- [ ] Zone-based approach
- [ ] Floor-based approach
- [ ] Export to PDF, Excel, CSV

---

## 📊 Success Metrics

- [ ] User can complete entire wizard in <10 minutes
- [ ] Zero blocking errors for valid inputs
- [ ] Real-time updates within 500ms
- [ ] Export generation within 5 seconds
- [ ] Mobile responsive on all screen sizes
- [ ] No console errors or warnings

---

## 🚀 Next Steps

1. **Start with infrastructure** - Update App.jsx and create MasterKeyWizard container
2. **Build Step 5.1** - Introduction (simplest, sets foundation)
3. **Build Step 5.2** - Hierarchy Setup (core functionality)
4. **Continue sequentially** through steps 5.3-5.6

---

**Ready to begin implementation!**
