# InstaSpec Platform - AI Planning Context Document

> **Purpose:** This document provides comprehensive context about the InstaSpec platform for AI-assisted strategic planning, feature expansion, and architectural evolution. Feed this document to Claude AI or similar LLMs when planning the platform's next phase of development.

---

## Table of Contents
1. [Platform Overview](#1-platform-overview)
2. [Business Domain](#2-business-domain)
3. [Current Technology Stack](#3-current-technology-stack)
4. [Implemented Features](#4-implemented-features)
5. [Data Architecture](#5-data-architecture)
6. [Security & Authentication](#6-security--authentication)
7. [Hardware Knowledge Base](#7-hardware-knowledge-base)
8. [Standards & Compliance](#8-standards--compliance)
9. [Export & Integration Capabilities](#9-export--integration-capabilities)
10. [Current Limitations](#10-current-limitations)
11. [Market Positioning](#11-market-positioning)
12. [Expansion Opportunities](#12-expansion-opportunities)
13. [Technical Debt & Recommendations](#13-technical-debt--recommendations)
14. [Appendix: Code Structure](#14-appendix-code-structure)

---

## 1. Platform Overview

### What is InstaSpec?

**InstaSpec** is a cloud-based door hardware specification platform designed for architects, contractors, door hardware consultants, and facility managers. It automates the complex process of specifying door hardware, generating master key systems, and ensuring compliance with international building standards.

### Core Value Proposition

| Problem | InstaSpec Solution |
|---------|-------------------|
| Manual door scheduling is error-prone | Automated door schedule with intelligent defaults |
| Hardware selection requires deep expertise | Rule-based hardware recommendations |
| Master key design is complex and time-consuming | Automated hierarchical keying with zone management |
| Compliance verification is tedious | Real-time validation against ANSI/BHMA and EN standards |
| Export formats vary by stakeholder | Multi-format export (PDF, Excel, CSV, BIM-ready) |

### Platform Identity

- **Product Name:** InstaSpec
- **Domain:** instaspec.techarix.com (production)
- **Company:** Techarix
- **Current Phase:** Beta (invite-only access)
- **Target Version:** 1.0.0

---

## 2. Business Domain

### Industry Context

InstaSpec operates in the **Architectural Door Hardware (ADH)** industry, specifically the specification and documentation segment. This industry involves:

- **Architects:** Design buildings, specify door locations and requirements
- **Door Hardware Consultants (DHC):** Specify hardware products and keying
- **General Contractors:** Execute specifications, procure hardware
- **Locksmiths/Integrators:** Install and maintain keying systems
- **Facility Managers:** Manage access control post-occupancy

### Door Hardware Ecosystem

```
Building Design → Door Schedule → Hardware Specification → Master Keying → Procurement → Installation
     ↓                 ↓                   ↓                    ↓              ↓            ↓
 Architect         InstaSpec          InstaSpec            InstaSpec      Contractor    Locksmith
                   (Current)          (Current)            (Current)      (Future?)     (Future?)
```

### Facility Types Supported

1. **Commercial Office** - Open layouts, meeting rooms, server rooms
2. **Hospital / Healthcare** - Patient rooms, operating theatres, clean utilities
3. **Education / School** - Classrooms, gymnasiums, music rooms
4. **Airport / Transport** - Security checkpoints, boarding gates, baggage areas
5. **Hospitality / Hotel** - Guest rooms, ballrooms, back-of-house areas
6. **Residential** - Unit entrances, common corridors, utility rooms

### Target Users (Personas)

| Persona | Role | Primary Use Case |
|---------|------|------------------|
| Sarah the Specifier | Door Hardware Consultant | Full hardware specification + keying |
| Mike the Manager | Facility Manager | Access control review + key requests |
| Alex the Architect | Design Architect | Door schedule + fire rating compliance |
| Tom the Technician | Security Integrator | Electrified hardware coordination |

---

## 3. Current Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 5.1.6 | Build tool & dev server |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| Lucide React | 0.344.0 | Icon library (1000+ icons) |

### Backend Services (Firebase)

| Service | Purpose |
|---------|---------|
| Firebase Authentication | Anonymous auth + beta code system |
| Cloud Firestore | Real-time database |
| Firebase Hosting | Static hosting (configured) |
| Cloud Functions | Server-side logic (scaffolded) |

### Document Generation

| Library | Purpose |
|---------|---------|
| jsPDF 4.0.0 | PDF generation |
| jspdf-autotable 5.0.7 | PDF tables |
| xlsx 0.18.5 | Excel workbook generation |
| file-saver 2.0.5 | Browser file downloads |

### Development Tools

| Tool | Purpose |
|------|---------|
| Vitest 1.6.0 | Unit testing |
| ESLint 8.57.1 | Code linting |
| PostCSS 8.4.35 | CSS processing |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                         │
├─────────────────────────────────────────────────────────────┤
│  AuthContext  │  MasterKeyContext  │  Component State       │
├───────────────┴────────────────────┴────────────────────────┤
│                 Firebase SDK (v12.6)                        │
├─────────────────────────────────────────────────────────────┤
│  Anonymous Auth  │  Firestore  │  Storage  │  Functions     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implemented Features

### 4.1 Project Management

**Status:** ✅ Fully Implemented

- Create new projects with facility type selection
- Save projects to cloud (Firestore)
- Load user's projects with real-time sync
- Delete projects
- Project metadata (name, facility, standard, timestamps)

**Key Code:** `src/auth/projectStore.js`

### 4.2 Door Schedule Builder

**Status:** ✅ Fully Implemented

- Add/edit/delete doors with full specifications
- Auto-generate door marks (D-001, D-002, etc.)
- Door properties:
  - Mark (unique identifier)
  - Use/function (from facility-specific presets)
  - Material (Timber, Metal, Glass, Aluminum)
  - Configuration (Single, Double)
  - Handing (LH, RH, LHR, RHR)
  - Fire rating (0, 30, 60, 90 minutes)
  - Zone/level assignment
  - Acoustic rating (STC)
  - ADA compliance flag

**Key Code:** `src/App.jsx` (lines 33-500+)

### 4.3 Hardware Specification Engine

**Status:** ✅ Fully Implemented

- BHMA-categorized hardware groups:
  - **Hanging:** Hinges, pivots, patch fittings
  - **Securing:** Locks, cylinders, electrified hardware
  - **Controlling:** Closers, stops, handles
  - **Protecting:** Seals, accessories, kick plates
- Material-based lock type filtering
- Electrified hardware recommendations
- Hardware set templates
- CSI MasterFormat codes (08 71 XX series)

**Hardware Catalog Structure:**
```javascript
{
  "Hinges": { csi: "08 71 10", types: ["Butt Hinge", "Concealed Hinge", ...] },
  "Locks": { csi: "08 71 50", types: ["Mortise Lock", "Cylindrical Lock", ...] },
  "Closers": { csi: "08 71 60", types: ["Overhead Closer", "Floor Spring", ...] },
  // ... 10 categories total
}
```

**Key Code:** `src/App.jsx` (PRODUCT_CATALOG constant, lines 335-431)

### 4.4 Master Key System

**Status:** ✅ Fully Implemented (Core Feature)

The most sophisticated feature of the platform. Supports complete hierarchical keying design per international standards.

#### 4.4.1 Supported Standards

| Standard | Region | Pins | Depths | MACS | Max Differs |
|----------|--------|------|--------|------|-------------|
| ANSI/BHMA A156.28-2023 | North America | 6 | 7 | 4 | 117,649 |
| EN 1303:2015 | Europe | 5 | 6 | 3 | 7,776 |

#### 4.4.2 Hierarchy Structures

**ANSI/BHMA Hierarchy:**
```
Level 0: GGM (Great Grand Master) → Symbol: "A"
Level 1: GMK (Grand Master Key)   → Symbol: "AA", "AB"...
Level 2: MK (Master Key)          → Symbol: "AAA", "AAB"...
Level 3: SMK (Sub-Master Key)     → Symbol: "AAAA"...
Level 4: CK (Change Key)          → Symbol: "AAAAA1"...
```

**EN 1303 Hierarchy:**
```
Level 0: GM (General Master)  → Symbol: "GMK"
Level 1: MK (Master Key)      → Symbol: "MK-1", "MK-2"...
Level 2: SK (Sub-Key)         → Symbol: "SK-1"...
Level 3: UK (User Key)        → Symbol: "CK-101"...
```

#### 4.4.3 Keying Approaches

| Approach | Description | Steps | Best For |
|----------|-------------|-------|----------|
| Zone-based | Auto-generates zones from door data | 5 | Multi-zone buildings |
| Custom Hierarchy | Full manual control | 7 | Complex requirements |
| Imported | Skip setup, validate existing | 3 | Migration/existing systems |

#### 4.4.4 Wizard Steps

1. **Introduction** - Standard selection, approach selection
2. **Hierarchy Planning** - Define keying depth (2-4 levels)
3. **Hierarchy Setup** - Create master keys with symbols
4. **Zone Definition** - Define physical zones (custom approach)
5. **Door Assignment** - Assign doors to masters, auto-generate change keys
6. **Validation** - Standards compliance verification
7. **Export** - Generate PDF/Excel/CSV deliverables

**Key Code:**
- Context: `src/features/masterkey/context/MasterKeyContext.jsx`
- Wizard: `src/features/masterkey/components/wizard/`
- Standards: `src/features/masterkey/utils/standards.js`
- Generators: `src/features/masterkey/utils/hierarchyGenerator.js`, `doorAssignmentGenerator.js`

### 4.5 Validation Engine

**Status:** ✅ Fully Implemented

**Hardware Set Validation:**
- Fire-rated doors require closers + seals
- Stairwell/exit doors require panic hardware
- Glass doors may need patch fittings

**Master Key Validation:**
- Key symbol format per standard
- MACS (Maximum Adjacent Cut Specification) enforcement
- Hierarchy structure integrity
- Differ utilization tracking

**Key Code:**
- `src/standards/validation.js`
- `src/features/masterkey/utils/standardsValidation.js`

### 4.6 Export System

**Status:** ✅ Fully Implemented

**PDF Export:**
- Professional multi-page documents
- Title page with project metadata
- Hierarchy structure tables
- Zone definitions
- Door assignment schedules
- Statistics summary

**Excel Export:**
- Multi-sheet workbooks
- Sheets: Project Info, Hierarchy, Zones, Assignments, Cutting List, Statistics
- Sortable/filterable data

**CSV Export:**
- Keying schedule
- Door assignments
- Hierarchy levels

**Key Code:** `src/features/masterkey/utils/exportGenerator.js`

### 4.7 Beta Access System

**Status:** ✅ Fully Implemented

- Email + code authentication
- Admin panel for user management
- Download usage tracking (10 downloads/user default)
- Login statistics
- Feedback collection with screenshots
- Access request management

**Key Code:**
- `src/auth/betaAccess.js`
- `src/components/BetaAdminPanel.jsx`
- `src/components/BetaAuthModal.jsx`

---

## 5. Data Architecture

### 5.1 Firestore Collections

```
Firebase Project: instaspec-dhw
├── userProfiles/{userId}
│   ├── uid: string
│   ├── email: string
│   └── updatedAt: timestamp
│
├── projects/{projectId}
│   ├── owner: string (UID)
│   ├── name: string
│   ├── facility: string
│   ├── standard: string
│   ├── doors: array<Door>
│   ├── sets: array<HardwareSet>
│   ├── mkProjectId: string (FK to mk_projects)
│   └── timestamps...
│
├── mk_projects/{mkProjectId}
│   ├── projectId: string (FK to projects)
│   ├── keyingApproach: string
│   ├── standard: string
│   ├── hierarchyLevels: number
│   ├── statistics: object
│   └── Subcollections:
│       ├── hierarchies/{id}
│       ├── zones/{id}
│       ├── assignments/{id}
│       ├── exports/{id}
│       ├── validations/{id}
│       └── audit_log/{id}
│
├── betaUsers/{email}
│   ├── code: string
│   ├── plan: string
│   ├── isAdmin: boolean
│   └── expiresAt: number
│
├── betaUsage/{email}
│   ├── count: number
│   └── limit: number
│
├── betaLoginLogs/{logId}
├── feedback/{feedbackId}
└── accessRequests/{requestId}
```

### 5.2 Key Data Models

**Door Model:**
```typescript
interface Door {
  id: string;
  mark: string;        // "D-001"
  use: string;         // "Office / Passage"
  material: string;    // "Timber" | "Metal" | "Glass" | "Aluminum"
  config: string;      // "Single" | "Double"
  handing: string;     // "LH" | "RH" | "LHR" | "RHR"
  fire: number;        // 0 | 30 | 60 | 90 (minutes)
  zone: string;
  level: string;       // Floor/level
  acoustic?: number;   // STC rating
  ada?: boolean;       // Accessibility compliance
}
```

**Hierarchy Model:**
```typescript
interface Hierarchy {
  hierarchyId: string;
  keySymbol: string;     // "AA", "MK-Floor1"
  levelName: string;     // "Grand Master - Building A"
  levelType: string;     // "GGM" | "GMK" | "MK" | "SMK" | "CK"
  order: number;
  parentHierarchyId: string | null;
  description?: string;
}
```

**Assignment Model:**
```typescript
interface Assignment {
  doorId: string;
  hierarchyId: string;       // Master key this door belongs to
  changeKeySymbol: string;   // "AAA-CK101"
  changeKeyName: string;     // "Change Key - D-001"
  createdAt: timestamp;
}
```

---

## 6. Security & Authentication

### Authentication Flow

```
1. User visits site
   ↓
2. Firebase Anonymous Sign-in (automatic)
   ↓
3. User enters beta email + code
   ↓
4. Validate against betaUsers collection
   ↓
5. Create/update userProfiles document (links UID to email)
   ↓
6. Session stored in localStorage
   ↓
7. All Firestore operations use ensureAuth() + UID-based rules
```

### Firestore Security Rules

```javascript
// Core helper functions
function isSignedIn() {
  return request.auth != null;
}

function isProjectOwner(projectId) {
  let project = get(/databases/$(database)/documents/projects/$(projectId));
  return project.data.owner == request.auth.uid;
}

// Projects: UID-based ownership
match /projects/{projectId} {
  allow read, write: if isSignedIn() &&
                       resource.data.owner == request.auth.uid;
}

// MK Projects: Check parent project ownership
match /mk_projects/{mkProjectId} {
  allow read: if isSignedIn() &&
                isProjectOwner(resource.data.projectId);
}
```

### Security Considerations

| Aspect | Current Implementation | Risk Level |
|--------|------------------------|------------|
| Authentication | Anonymous + Beta code | Medium (no email verification) |
| Authorization | UID-based Firestore rules | Low |
| Data Isolation | Per-user project ownership | Low |
| API Security | Firebase SDK handles tokens | Low |
| Input Validation | Client-side only | Medium |
| Rate Limiting | None implemented | High |

---

## 7. Hardware Knowledge Base

### Product Catalog Structure

The platform contains a built-in hardware knowledge base with 10 categories:

| Category | CSI Code | Product Types |
|----------|----------|---------------|
| Hinges | 08 71 10 | Butt, Concealed, Pivot, Continuous, Patch Fitting |
| Locks | 08 71 50 | Mortise, Cylindrical, Hotel, Panic Bar, Electric Strike, Mag Lock, Patch Lock |
| Closers | 08 71 60 | Overhead, Concealed, Floor Spring, Auto Operator |
| Handles | 08 71 70 | Lever, Pull, Push Plate, Panic Push Pull |
| Stops | 08 71 80 | Door Stop, Overhead Stop |
| Seals | 08 71 90 | Drop, Perimeter, Acoustic, Threshold |
| Cylinders | 08 71 50 | Euro, Oval, Rim, Mortise |
| Accessories | 08 71 00 | Kick Plate, Flush Bolt, Door Viewer |
| Protecting | 08 79 00 | Signage |
| Electrified | 08 74 00 | Mag Lock, Electric Strike, Card Reader, Power Supply |

### Material-Based Rules

```javascript
// Locks allowed per material
LOCK_TYPE_RULES = {
  Timber: ["Mortise Lock", "Cylindrical Lock", "Hotel Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Metal: ["Mortise Lock", "Panic Bar", "Electric Strike", "Magnetic Lock"],
  Aluminum: ["Mortise Lock", "Electric Strike", "Magnetic Lock"],
  Glass: ["Patch Lock", "Panic Bar", "Magnetic Lock"]
}

// Electrified hardware allowed per material
ELECTRIFIED_TYPE_RULES = {
  Timber: ["Magnetic Lock", "Electric Strike", "Card Reader"],
  Metal: ["Magnetic Lock", "Electric Strike", "Electromechanical Mortise", "Card Reader"],
  Aluminum: ["Magnetic Lock", "Electric Strike", "Card Reader"],
  Glass: ["Magnetic Lock", "Card Reader"]
}
```

### Lock Function Styles

**ANSI Functions (Mortise):**
- Passage, Privacy, Classroom, Storeroom, Entrance, Office, Apartment, Dormitory, Institutional

**EN Functions (Mortise):**
- Sashlock, Deadlock, Latch, Bathroom Lock, Nightlatch

### Acoustic Recommendations

```javascript
ACOUSTIC_RECOMMENDATIONS = {
  "Meeting Room": 40,      // STC 40
  "Director Cabin": 40,
  "Conference Room": 45,
  "Patient Room": 35,
  "Consultation / Exam": 40,
  "Classroom": 35,
  "Music Room": 50,
  "Prayer / Quiet Room": 45,
  "Server / IT": 40,
  "Guest Room Entry": 42,
  "Unit Entrance (Fire Rated)": 35,
  "Restroom": 30
}
```

---

## 8. Standards & Compliance

### Supported Standards

#### ANSI/BHMA A156.28-2023 (North America)
- **Scope:** Master keying terminology and practices
- **Pin Configuration:** 6 pins, 7 depths
- **MACS:** 4 (Maximum Adjacent Cut Specification)
- **Max Differs:** 117,649 (7^6)
- **Security Grades:** Grade 1 (Heavy-duty), Grade 2 (Standard), Grade 3 (Light)

#### EN 1303:2015 (Europe)
- **Scope:** Cylinders for locks
- **Pin Configuration:** 5 pins, 6 depths
- **MACS:** 3
- **Max Differs:** 7,776 (6^5)
- **Security Classes:** Class 1-6 (Very Low to Maximum)

### Facility Recommendations

| Facility Type | ANSI Depth | EN Depth | ANSI Levels | EN Levels |
|--------------|------------|----------|-------------|-----------|
| Commercial Office | 3 | 2 | GMK→MK→CK | MK→UK |
| Hospital | 4 | 3 | GMK→MK→SMK→CK | GM→MK→UK |
| Education | 3 | 2 | GMK→MK→CK | MK→UK |
| Airport | 4 | 3 | GMK→MK→SMK→CK | GM→MK→UK |
| Hotel | 4 | 3 | GMK→MK→SMK→CK | GM→MK→UK |
| Residential | 2 | 2 | MK→CK | MK→UK |

### Validation Rules

**Hardware Compliance:**
- Fire-rated doors → Closer + Seals required
- Stairwell/Exit doors → Panic hardware required
- Glass doors → Patch fittings warning

**Keying Compliance:**
- Key symbols must follow standard format
- Adjacent cuts must not exceed MACS
- Restricted letters (ANSI): I, O, Q, X not allowed in symbols
- Sequential warnings for non-sequential symbol usage

---

## 9. Export & Integration Capabilities

### Current Export Formats

| Format | Content | Use Case |
|--------|---------|----------|
| PDF | Professional keying schedule | Client presentations, contractor handoff |
| Excel | Multi-sheet workbook | Procurement, analysis |
| CSV | Raw data files | Custom processing, import to other systems |

### Export Contents

**Every export includes:**
- Project metadata (standard, version, facility type)
- Hierarchy structure with symbols and names
- Zone definitions (if applicable)
- Complete door assignments
- Key cutting list
- Statistics (differs used, capacity remaining)

### Integration Points (Current)

| System | Integration Level | Method |
|--------|------------------|--------|
| Firebase | Native | SDK |
| Browser | Native | File download API |
| Excel | Export | XLSX library |
| PDF | Export | jsPDF library |

### Future Integration Opportunities

| System | Potential Method | Value |
|--------|-----------------|-------|
| Revit/BIM | IFC/COBie export | Direct model integration |
| Autodesk ACC | REST API | Cloud project sync |
| OpenDoor | Data format | Standard door data exchange |
| ERP Systems | CSV/API | Procurement automation |
| Access Control | API | Key management sync |

---

## 10. Current Limitations

### Technical Limitations

| Area | Limitation | Impact |
|------|------------|--------|
| Offline Support | None | Requires internet connection |
| Mobile UX | Basic responsive | Not optimized for mobile workflows |
| Multi-user | Single user per project | No collaboration features |
| Version Control | None | No project history/rollback |
| Import | Limited | No Excel/CSV import for doors |
| API | None | No external API access |
| Localization | English only | Limited international adoption |

### Feature Gaps

| Feature | Current State | Industry Expectation |
|---------|--------------|---------------------|
| BIM Integration | None | Revit plugin or IFC export |
| Hardware Pricing | None | Cost estimation |
| Vendor Catalogs | Generic | Manufacturer-specific data |
| Project Sharing | None | Team collaboration |
| Approval Workflow | None | Spec review process |
| Change Tracking | None | Revision history |
| Mobile App | None | On-site data collection |

### Scale Considerations

| Metric | Current Capacity | Notes |
|--------|-----------------|-------|
| Projects per user | Unlimited | Firestore scalable |
| Doors per project | ~1000 tested | Client-side rendering limit |
| Concurrent users | ~100 | Firebase free tier |
| Storage | 1GB | Firebase free tier |

---

## 11. Market Positioning

### Competitive Landscape

| Competitor | Strengths | Weaknesses | InstaSpec Advantage |
|------------|-----------|------------|---------------------|
| Comsense | Established, full-featured | Legacy UI, expensive | Modern UX, accessible |
| OpeningStudio | Revit integration | Complex, enterprise-only | Standalone, simple |
| SpecLink | Industry standard | General-purpose | Door hardware focused |
| Manual (Excel) | Familiar, flexible | Error-prone, no validation | Automation, compliance |

### Target Market Segments

**Primary:**
- Small-to-medium door hardware consultancies (1-20 employees)
- Architectural firms without dedicated hardware specifiers
- Facility managers at multi-site organizations

**Secondary:**
- Lock and security integrators
- General contractors with hardware scopes
- Educational institutions (training tool)

### Value Metrics

| Metric | Estimated Improvement |
|--------|----------------------|
| Specification time | 60-80% reduction |
| Error rate | 90% reduction |
| Master key design time | 70% reduction |
| Export generation | 95% reduction |
| Compliance verification | 100% automated |

---

## 12. Expansion Opportunities

### Near-Term Features (3-6 months)

| Feature | Complexity | Value | Notes |
|---------|------------|-------|-------|
| Excel import for doors | Medium | High | Upload existing schedules |
| Project templates | Low | Medium | Pre-configured facility setups |
| Hardware pricing engine | High | High | Cost estimation |
| Enhanced validation | Medium | High | More code compliance rules |
| Audit trail | Low | Medium | Change history logging |
| Mobile-optimized views | Medium | Medium | On-site access |

### Medium-Term Features (6-12 months)

| Feature | Complexity | Value | Notes |
|---------|------------|-------|-------|
| Revit/BIM export | High | Very High | IFC or direct plugin |
| Team collaboration | High | High | Multi-user projects |
| Manufacturer integrations | High | High | Real product data |
| API for integrations | Medium | High | Headless access |
| White-label capability | Medium | Medium | Reseller opportunity |
| Advanced keying (KA groups) | Medium | Medium | Keyed Alike support |

### Long-Term Vision (12+ months)

| Initiative | Strategic Value |
|------------|-----------------|
| AI-powered specification | Auto-suggest hardware based on project context |
| Predictive compliance | Flag issues before validation |
| Market data analytics | Pricing trends, product popularity |
| IoT integration | Smart lock configuration export |
| AR door visualization | Mobile hardware preview |
| Industry marketplace | Connect specifiers with suppliers |

### Platform Evolution Paths

**Path A: Vertical Depth**
Focus on being the best door hardware specification tool.
- Deeper standards support (AS, BS, DIN)
- More facility types (data centers, clean rooms)
- Advanced keying scenarios (restricted keyways, construction keying)

**Path B: Horizontal Expansion**
Expand to adjacent specification domains.
- Window hardware
- Bathroom accessories
- General architectural hardware
- Access control systems

**Path C: Ecosystem Platform**
Become the central hub for hardware projects.
- Vendor marketplace
- Installer network
- Maintenance scheduling
- Lifecycle management

---

## 13. Technical Debt & Recommendations

### Current Technical Debt

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Large App.jsx file (~290KB) | Medium | Split into feature modules |
| No TypeScript | Medium | Migrate for type safety |
| Limited test coverage | High | Add unit/integration tests |
| No error boundaries | Medium | Add React error handling |
| Client-side only validation | Medium | Add server-side validation |
| No rate limiting | High | Implement API throttling |
| No logging/monitoring | High | Add observability |

### Recommended Architecture Evolution

**Phase 1: Modularization**
```
src/
├── features/
│   ├── projects/         # Project management
│   ├── doors/            # Door schedule
│   ├── hardware/         # Hardware specification
│   ├── masterkey/        # Master key system (exists)
│   └── export/           # Export generation
├── shared/
│   ├── components/       # Reusable UI
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
└── core/
    ├── auth/             # Authentication
    ├── api/              # API layer
    └── store/            # State management
```

**Phase 2: Type Safety**
- Migrate to TypeScript
- Define interfaces for all data models
- Add runtime validation (Zod or Yup)

**Phase 3: Testing**
- Unit tests for utilities and generators
- Integration tests for workflows
- E2E tests for critical paths (Cypress)

**Phase 4: Backend Evolution**
- Cloud Functions for sensitive operations
- Server-side validation
- Rate limiting and abuse prevention
- Webhook support for integrations

### Performance Recommendations

| Area | Current | Recommendation |
|------|---------|----------------|
| Bundle size | ~2MB | Code splitting, lazy loading |
| Initial load | ~3s | Service worker, preloading |
| Large projects | Slow rendering | Virtual scrolling |
| PDF generation | Client-side | Move to Cloud Function |
| Real-time sync | All data | Paginated queries |

---

## 14. Appendix: Code Structure

### Directory Structure

```
d:\Github\dhw-spec-smart-app/
├── src/
│   ├── auth/                           # Authentication & access control
│   │   ├── AuthContext.jsx             # User session context
│   │   ├── betaAccess.js               # Beta user validation
│   │   ├── projectStore.js             # Project CRUD operations
│   │   ├── userProfile.js              # User profile management
│   │   └── feedbackStore.js            # Feedback operations
│   │
│   ├── components/                     # Global UI components
│   │   ├── BetaAuthModal.jsx           # Login modal
│   │   ├── BetaAdminPanel.jsx          # Admin dashboard
│   │   ├── BetaFeedbackModal.jsx       # Feedback submission
│   │   └── FeedbackModal.jsx           # General feedback
│   │
│   ├── features/
│   │   └── masterkey/                  # Master key system
│   │       ├── components/
│   │       │   ├── wizard/             # 7-step wizard components
│   │       │   │   ├── MasterKeyWizard.jsx
│   │       │   │   ├── Step1Introduction.jsx
│   │       │   │   ├── Step1_5HierarchyPlanning.jsx
│   │       │   │   ├── Step2HierarchySetup.jsx
│   │       │   │   ├── Step3ZoneDefinition.jsx
│   │       │   │   ├── Step4DoorAssignment.jsx
│   │       │   │   ├── Step5Validation.jsx
│   │       │   │   └── Step6Export.jsx
│   │       │   └── shared/
│   │       │       └── MasterKeyToggleWithContext.jsx
│   │       ├── context/
│   │       │   └── MasterKeyContext.jsx  # State management (1200+ lines)
│   │       └── utils/
│   │           ├── standards.js          # ANSI/EN configurations
│   │           ├── standardsValidation.js # Symbol validation
│   │           ├── hierarchyGenerator.js  # Key symbol generation
│   │           ├── doorAssignmentGenerator.js # Auto-assignment
│   │           └── exportGenerator.js     # PDF/Excel/CSV export
│   │
│   ├── standards/                      # Building standards
│   │   ├── validation.js               # Hardware compliance checks
│   │   └── trace.js                    # Debug tracing
│   │
│   ├── App.jsx                         # Main app (~290KB, needs refactor)
│   ├── main.jsx                        # React entry point
│   └── firebase.js                     # Firebase configuration
│
├── functions/                          # Cloud Functions (scaffolded)
├── dist/                               # Production build output
├── tests/                              # Test files
├── firestore.rules                     # Security rules
├── firestore.indexes.json              # Firestore indexes
├── firebase.json                       # Firebase config
├── package.json                        # Dependencies
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # Tailwind configuration
└── .env                                # Environment variables
```

### Key File Sizes

| File | Lines | Notes |
|------|-------|-------|
| App.jsx | ~4500+ | Monolithic, needs splitting |
| MasterKeyContext.jsx | ~1200 | Core master key logic |
| exportGenerator.js | ~300 | PDF/Excel generation |
| standards.js | ~175 | Standards configuration |
| BetaAdminPanel.jsx | ~600 | Admin dashboard |

### State Management Summary

| Context | Purpose | Key State |
|---------|---------|-----------|
| AuthContext | User session | user, login(), logout() |
| MasterKeyContext | Keying system | mkProject, hierarchies, assignments, zones |

### Firebase Collections Summary

| Collection | Documents | Subcollections |
|------------|-----------|----------------|
| projects | Per-user projects | None |
| mk_projects | Master key projects | hierarchies, zones, assignments, exports, validations, audit_log |
| userProfiles | UID-to-email mapping | None |
| betaUsers | Beta access records | None |
| betaUsage | Download tracking | None |
| feedback | User feedback | None |
| betaLoginLogs | Login events | None |
| accessRequests | Beta access requests | None |

---

## Using This Document

### For Feature Planning

When asking Claude to plan new features:

```
Context: [Paste relevant sections from this document]

Task: Design a feature for [description]

Consider:
- How it integrates with existing architecture
- Data model changes required
- UI/UX implications
- Standards compliance requirements
```

### For Architecture Decisions

When discussing technical direction:

```
Context: [Paste technology stack and code structure sections]

Question: Should we [architectural decision]?

Evaluate against:
- Current technical debt
- Recommended evolution path
- Scale considerations
```

### For Competitive Analysis

When positioning the product:

```
Context: [Paste market positioning section]

Analyze: How does [competitor/feature] compare?

Consider:
- Current capabilities
- Expansion opportunities
- Target market needs
```

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Platform Version:** 1.0.0-beta
**Maintainer:** Techarix Development Team
