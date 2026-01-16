# Master Key System - Firestore Schema Update

## Overview
This document describes the Firestore schema updates required for the Master Key System feature.

## Updated Collections

### 1. `projects` Collection (EXISTING - ADD NEW FIELDS)

Each project document should include these new fields:

```javascript
{
  // ... existing fields ...
  projectName: string,
  facilityType: string,
  createdBy: string,
  createdAt: timestamp,

  // NEW MASTER KEY FIELDS (Phase 1)
  mkSystemEnabled: boolean,           // Default: false
  mkSystemStatus: string,             // "not_started" | "in_progress" | "completed" | "archived" | null
  mkApproach: string,                 // "zone_based" | "custom_hierarchy" | "imported" | null
  mkProjectId: string,                // Reference to mk_projects/{id} (created in Phase 2)
}
```

### Field Descriptions:

- **`mkSystemEnabled`**: Boolean flag indicating if Master Key System is enabled for this project
- **`mkSystemStatus`**: Workflow status of the MK system
  - `null` - MK system not enabled
  - `"not_started"` - Toggle enabled but Step 5 not visited
  - `"in_progress"` - User is working on Step 5
  - `"completed"` - MK system fully configured and validated
  - `"archived"` - Historical/archived MK configuration

- **`mkApproach`**: Selected approach for MK system design
  - `"zone_based"` - Auto-generate from door zones (recommended)
  - `"custom_hierarchy"` - Manual hierarchy design with wizard
  - `"imported"` - Import from external keying schedule

- **`mkProjectId`**: UUID reference to the corresponding document in `mk_projects` collection (set when MK system is initialized in Phase 2)

---

## Phase 1 Implementation Notes

### Current Implementation (Local State)
In Phase 1, these fields are stored in the `projects` array in localStorage via the existing `saveProjectForUser` function in `src/auth/projectStore.js`.

The fields are automatically saved when:
1. User toggles MK System ON/OFF
2. User selects an approach (zone_based/custom_hierarchy/imported)
3. User clicks "Save & Continue" in Step 0

### Example Project Object (Phase 1):
```javascript
{
  id: "proj_abc123",
  name: "Building A - Commercial Office",
  type: "Commercial Office",
  standard: "ANSI",
  doors: [...],
  sets: [...],

  // NEW MK FIELDS
  mkSystemEnabled: true,
  mkSystemStatus: "not_started",
  mkApproach: "zone_based",
  mkProjectId: null,  // Will be set in Phase 2

  createdAt: 1673894400000,
  updatedAt: 1673980800000
}
```

---

## Phase 2+ Firestore Collections

These will be created in Phase 2 when we implement Firebase Cloud Functions:

### 2. `mk_projects/{mkProjectId}` (NEW COLLECTION - Phase 2)
```javascript
{
  projectId: string,                  // Reference back to projects/{id}
  keyingApproach: string,
  hierarchyLevels: number,
  maxDiffersAvailable: number,
  differsUsed: number,
  manufacturer: string,
  keyway: string,
  pinConfiguration: {
    pins: number,
    depths: number,
    macs: number,
  },
  securityLevel: string,
  constructionKeyingEnabled: boolean,
  constructionMasterKey: string,
  statistics: {
    totalDoors: number,
    keyedDoors: number,
    unkeyedDoors: number,
    totalKeys: number,
    zonesDefined: number,
  },
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp,
}
```

### 3. `mk_projects/{mkProjectId}/hierarchies/{hierarchyId}` (SUBCOLLECTION - Phase 2)
```javascript
{
  mkProjectId: string,
  parentHierarchyId: string | null,
  level: number,
  levelName: string,
  keySymbol: string,
  keyType: string,
  keyDescription: string,
  accessScope: string,
  securityZone: string,
  quantityRequired: number,
  keyHolder: string,
  bittingEncrypted: boolean,
  bittingRef: string,
  doorsCount: number,
  childrenCount: number,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### 4. `mk_projects/{mkProjectId}/assignments/{assignmentId}` (SUBCOLLECTION - Phase 3)
```javascript
{
  mkProjectId: string,
  doorId: string,
  hierarchyId: string,
  assignmentType: string,
  lockPosition: string,
  cylinderType: string,
  isCrossKeyed: boolean,
  crossKeyNotes: string,
  // Denormalized for performance
  doorNumber: string,
  doorName: string,
  keySymbol: string,
  assignedAt: timestamp,
  assignedBy: string,
}
```

### 5. `mk_projects/{mkProjectId}/zones/{zoneId}` (SUBCOLLECTION - Phase 3)
```javascript
{
  mkProjectId: string,
  zoneName: string,
  zoneType: string,
  zoneCode: string,
  parentZoneId: string | null,
  securityClassification: string,
  accessHours: string,
  hierarchyId: string | null,
  doorCount: number,
  createdAt: timestamp,
}
```

---

## Firestore Security Rules (Phase 2)

Add these security rules to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing rules...

    // Master Key Projects
    match /mk_projects/{mkProjectId} {
      allow read: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid ||
         request.auth.token.admin == true);

      allow create: if request.auth != null;

      allow update, delete: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid ||
         request.auth.token.admin == true);

      // Subcollections
      match /hierarchies/{hierarchyId} {
        allow read, write: if request.auth != null;
      }

      match /assignments/{assignmentId} {
        allow read, write: if request.auth != null;
      }

      match /zones/{zoneId} {
        allow read, write: if request.auth != null;
      }

      match /exports/{exportId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
      }

      match /audit_log/{auditId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
      }
    }

    // Secured bitting data - restricted access
    match /secure_bitting/{bittingId} {
      allow read: if request.auth != null &&
        (request.auth.uid in resource.data.accessibleBy ||
         request.auth.token.admin == true ||
         request.auth.token.locksmith == true);

      allow create: if request.auth != null;
      allow update, delete: if false;  // No updates/deletes allowed
    }
  }
}
```

---

## Firestore Indexes (Phase 2)

Add these composite indexes to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "assignments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mkProjectId", "order": "ASCENDING" },
        { "fieldPath": "assignedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "hierarchies",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mkProjectId", "order": "ASCENDING" },
        { "fieldPath": "level", "order": "ASCENDING" },
        { "fieldPath": "keySymbol", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "zones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mkProjectId", "order": "ASCENDING" },
        { "fieldPath": "zoneType", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Migration Notes

### For Existing Projects
When Phase 2 is deployed, existing projects will need migration:

```javascript
// Migration function (run once)
async function migrateExistingProjects() {
  const projectsSnapshot = await db.collection('projects').get();

  const batch = db.batch();

  projectsSnapshot.docs.forEach(doc => {
    const ref = db.collection('projects').doc(doc.id);
    batch.update(ref, {
      mkSystemEnabled: false,
      mkSystemStatus: null,
      mkApproach: null,
      mkProjectId: null,
    });
  });

  await batch.commit();
  console.log('Migration complete');
}
```

---

## Testing Checklist

### Phase 1 (Current)
- [ ] Toggle MK System ON in Step 0
- [ ] Verify `mkSystemEnabled` = true in project state
- [ ] Select different approaches (zone_based, custom_hierarchy, imported)
- [ ] Verify `mkApproach` updates correctly
- [ ] Toggle MK System OFF
- [ ] Verify `mkSystemEnabled` = false and `mkSystemStatus` = null
- [ ] Save project and reload - verify persistence

### Phase 2 (Next)
- [ ] Enable MK System and click "Save & Continue"
- [ ] Verify `mk_projects` document created in Firestore
- [ ] Verify `mkProjectId` reference set in projects document
- [ ] Check Firestore console for correct data structure

---

## End of Schema Documentation
