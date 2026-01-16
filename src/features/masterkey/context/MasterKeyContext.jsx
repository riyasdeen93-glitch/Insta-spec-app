import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, getDocs, writeBatch, collection, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, ensureAuth } from '../../../firebase';
import { getStandardConfig, getRecommendedHierarchy, STANDARDS } from '../utils/standards';
import { validateStandardsCompliance } from '../utils/standardsValidation';

const MasterKeyContext = createContext(null);

export const useMasterKey = () => {
  const context = useContext(MasterKeyContext);
  if (!context) {
    throw new Error('useMasterKey must be used within MasterKeyProvider');
  }
  return context;
};

export const MasterKeyProvider = ({ children, projectId, projectDoors = [] }) => {
  // =====================================================
  // STATE
  // =====================================================
  const [mkProject, setMKProject] = useState(null);
  const [hierarchies, setHierarchies] = useState([]);
  const [hierarchyTree, setHierarchyTree] = useState([]);
  const [zones, setZones] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [kaGroups, setKaGroups] = useState([]); // NEW: KA (Keyed Alike) groups
  const [validationIssues, setValidationIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =====================================================
  // PROJECT-LEVEL STATE (for toggle)
  // =====================================================
  const [mkSystemEnabled, setMkSystemEnabled] = useState(false);
  const [mkApproach, setMkApproach] = useState('zone_based');
  const [standard, setStandard] = useState('ANSI_BHMA');

  // =====================================================
  // LOAD MK PROJECT WITH REAL-TIME LISTENER
  // =====================================================
  const loadMKProject = useCallback((mkProjectId) => {
    if (!mkProjectId) return;

    // Set up real-time listener for mk_projects document
    const unsubscribe = onSnapshot(
      doc(db, 'mk_projects', mkProjectId),
      (mkProjectSnap) => {
        if (mkProjectSnap.exists()) {
          const mkProjectData = { id: mkProjectSnap.id, ...mkProjectSnap.data() };
          setMKProject(mkProjectData);
          console.log('✅ MK Project updated:', {
            differsUsed: mkProjectData.differsUsed,
            totalPhysicalKeys: mkProjectData.totalPhysicalKeys,
            totalCylinders: mkProjectData.totalCylinders
          });
        } else {
          console.log('❌ MK Project document does not exist:', mkProjectId);
          setMKProject(null);
        }
      },
      (err) => {
        console.error('Error listening to MK project:', err);
        setError(err.message);
      }
    );

    // Return cleanup function
    return unsubscribe;
  }, []);

  // =====================================================
  // LISTEN TO PROJECT FOR MK FIELDS
  // =====================================================
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    let mkProjectUnsubscribe = null;

    const projectUnsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (projectSnap) => {
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();

          // Update local state
          setMkSystemEnabled(Boolean(projectData.mkSystemEnabled));
          setMkApproach(projectData.mkApproach || 'zone_based');
          setStandard(projectData.mkStandard || 'ANSI_BHMA');

          // If MK system is enabled and has mkProjectId, set up listener
          if (projectData.mkSystemEnabled && projectData.mkProjectId) {
            // Clean up previous MK project listener if any
            if (mkProjectUnsubscribe) {
              mkProjectUnsubscribe();
            }
            // Set up new listener
            mkProjectUnsubscribe = loadMKProject(projectData.mkProjectId);
          } else {
            // Clean up MK project listener if system disabled
            if (mkProjectUnsubscribe) {
              mkProjectUnsubscribe();
              mkProjectUnsubscribe = null;
            }
            setMKProject(null);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to project:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      projectUnsubscribe();
      if (mkProjectUnsubscribe) {
        mkProjectUnsubscribe();
      }
    };
  }, [projectId, loadMKProject]);

  // =====================================================
  // TOGGLE MK SYSTEM
  // =====================================================
  const toggleMKSystem = useCallback(async (enabled) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure Firebase Auth is ready before accessing Firestore
      await ensureAuth();

      console.log('toggleMKSystem called with:', enabled);

      if (enabled) {
        // ENABLING MK SYSTEM - Create mk_projects document
        const mkProjectRef = doc(collection(db, 'mk_projects'));

        // Get standard configuration
        const standardConfig = getStandardConfig(standard);
        const pinConfig = standardConfig.pinConfig;
        const maxDiffers = standardConfig.maxDiffers;

        await setDoc(mkProjectRef, {
          projectId,
          keyingApproach: mkApproach || 'zone_based',
          standard: standard,
          standardVersion: standardConfig.version,
          hierarchyLevels: 4,
          maxDiffersAvailable: maxDiffers,
          differsUsed: 0,
          manufacturer: 'Schlage',
          keyway: 'C Keyway',
          pinConfiguration: pinConfig,
          securityLevel: 'standard',
          constructionKeyingEnabled: false,
          constructionMasterKey: null,
          statistics: {
            totalDoors: 0,
            keyedDoors: 0,
            unkeyedDoors: 0,
            totalKeys: 0,
            zonesDefined: 0,
          },
          mkSystemStatus: 'in_progress',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completedAt: null,
        });

        // Update project with mkProjectId and standard
        await updateDoc(doc(db, 'projects', projectId), {
          mkSystemEnabled: true,
          mkSystemStatus: 'not_started',
          mkApproach: mkApproach,
          mkStandard: standard,
          mkProjectId: mkProjectRef.id,
        });

        console.log(`MK project created: ${mkProjectRef.id}`);
      } else {
        // DISABLING MK SYSTEM - Delete mk_projects document
        const projectSnap = await getDoc(doc(db, 'projects', projectId));
        const projectData = projectSnap.data();

        if (projectData?.mkProjectId) {
          // TODO: Delete subcollections (hierarchies, assignments, etc.)
          // For now, just delete the main document
          await updateDoc(doc(db, 'projects', projectId), {
            mkSystemEnabled: false,
            mkSystemStatus: null,
            mkApproach: null,
            mkProjectId: null,
          });

          console.log(`MK project disabled for project ${projectId}`);
        } else {
          await updateDoc(doc(db, 'projects', projectId), {
            mkSystemEnabled: false,
            mkSystemStatus: null,
            mkApproach: null,
          });
        }
      }

      // Update local state immediately for instant UI feedback
      setMkSystemEnabled(enabled);

      console.log('MK system toggled successfully');
    } catch (err) {
      console.error('Error toggling MK system:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, mkApproach, standard]);

  // =====================================================
  // UPDATE MK APPROACH
  // =====================================================
  const updateMKApproach = useCallback(async (approach) => {
    try {
      setError(null);

      // Ensure Firebase Auth is ready before accessing Firestore
      await ensureAuth();

      console.log('updateMKApproach called with:', approach);

      // Update project document
      await updateDoc(doc(db, 'projects', projectId), {
        mkApproach: approach,
      });

      // Update mk_projects document if it exists
      if (mkProject?.id) {
        await updateDoc(doc(db, 'mk_projects', mkProject.id), {
          keyingApproach: approach,
          updatedAt: serverTimestamp(),
        });
      }

      // Update local state
      setMkApproach(approach);

      console.log('MK approach updated successfully');
    } catch (err) {
      console.error('Error updating MK approach:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId, mkProject]);

  // =====================================================
  // UPDATE STANDARD
  // =====================================================
  const updateStandard = useCallback(async (newStandard) => {
    try {
      setError(null);

      // Ensure Firebase Auth is ready before accessing Firestore
      await ensureAuth();

      console.log('updateStandard called with:', newStandard);

      // Update project document
      await updateDoc(doc(db, 'projects', projectId), {
        mkStandard: newStandard,
      });

      // Update mk_projects document if it exists
      if (mkProject?.id) {
        const standardConfig = getStandardConfig(newStandard);
        await updateDoc(doc(db, 'mk_projects', mkProject.id), {
          standard: newStandard,
          standardVersion: standardConfig.version,
          pinConfiguration: standardConfig.pinConfig,
          maxDiffersAvailable: standardConfig.maxDiffers,
          updatedAt: serverTimestamp(),
        });
      }

      // Update local state
      setStandard(newStandard);

      console.log('Standard updated successfully');
    } catch (err) {
      console.error('Error updating standard:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId, mkProject]);

  // =====================================================
  // UPDATE MK PROJECT FIELDS
  // =====================================================
  const updateMKProject = useCallback(async (updates) => {
    try {
      setError(null);

      // Ensure Firebase Auth is ready before accessing Firestore
      await ensureAuth();

      if (!mkProject?.id) {
        throw new Error('No MK project found');
      }

      console.log('updateMKProject called with:', updates);

      // Update mk_projects document
      await updateDoc(doc(db, 'mk_projects', mkProject.id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log('MK Project updated successfully');
    } catch (err) {
      console.error('Error updating MK project:', err);
      setError(err.message);
      throw err;
    }
  }, [mkProject]);

  // =====================================================
  // LISTEN TO HIERARCHIES (Phase 3)
  // =====================================================
  useEffect(() => {
    if (!mkProject?.id) return;

    const q = query(
      collection(db, 'mk_projects', mkProject.id, 'hierarchies')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hierarchyList = snapshot.docs.map(doc => ({
        hierarchyId: doc.id,
        ...doc.data(),
      }));

      setHierarchies(hierarchyList);

      // Build tree structure
      const tree = buildHierarchyTree(hierarchyList);
      setHierarchyTree(tree);
    });

    return () => unsubscribe();
  }, [mkProject?.id]);

  // =====================================================
  // LISTEN TO ZONES (Phase 3.2)
  // =====================================================
  useEffect(() => {
    if (!mkProject?.id) return;

    const q = query(
      collection(db, 'mk_projects', mkProject.id, 'zones')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zoneList = snapshot.docs.map(doc => ({
        zoneId: doc.id,
        ...doc.data(),
      }));

      setZones(zoneList);
      console.log('✅ Zones updated:', zoneList.length, 'zones');
    });

    return () => unsubscribe();
  }, [mkProject?.id]);

  // =====================================================
  // LISTEN TO ASSIGNMENTS (Phase 3.2)
  // =====================================================
  useEffect(() => {
    if (!mkProject?.id) return;

    const q = query(
      collection(db, 'mk_projects', mkProject.id, 'assignments')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignmentList = snapshot.docs.map(doc => ({
        assignmentId: doc.id,
        ...doc.data(),
      }));

      setAssignments(assignmentList);
      console.log('✅ Assignments updated:', assignmentList.length, 'assignments');
    });

    return () => unsubscribe();
  }, [mkProject?.id]);

  // =====================================================
  // LISTEN TO KA GROUPS
  // =====================================================
  useEffect(() => {
    if (!mkProject?.id) {
      setKaGroups([]);
      return;
    }

    const q = query(
      collection(db, 'mk_projects', mkProject.id, 'ka_groups')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kaGroupList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setKaGroups(kaGroupList);
      console.log('✅ KA Groups updated:', kaGroupList.length, 'groups');
    });

    return () => unsubscribe();
  }, [mkProject?.id]);

  // =====================================================
  // HELPER: BUILD HIERARCHY TREE
  // =====================================================
  const buildHierarchyTree = (hierarchyList) => {
    const map = new Map();
    const roots = [];

    hierarchyList.forEach(node => {
      map.set(node.hierarchyId, { ...node, children: [] });
    });

    hierarchyList.forEach(node => {
      const current = map.get(node.hierarchyId);
      if (node.parentHierarchyId) {
        const parent = map.get(node.parentHierarchyId);
        if (parent) {
          parent.children.push(current);
        }
      } else {
        roots.push(current);
      }
    });

    return roots;
  };

  // =====================================================
  // HIERARCHY MANAGEMENT FUNCTIONS
  // =====================================================
  const addHierarchyLevel = useCallback(async (levelData) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const hierarchyRef = collection(db, 'mk_projects', mkProject.id, 'hierarchies');
      await addDoc(hierarchyRef, {
        ...levelData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Hierarchy level added successfully');
    } catch (err) {
      console.error('Failed to add hierarchy level:', err);
      throw err;
    }
  }, [mkProject]);

  const updateHierarchyLevel = useCallback(async (hierarchyId, updates) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const hierarchyRef = doc(db, 'mk_projects', mkProject.id, 'hierarchies', hierarchyId);
      await updateDoc(hierarchyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Hierarchy level updated successfully');
    } catch (err) {
      console.error('Failed to update hierarchy level:', err);
      throw err;
    }
  }, [mkProject]);

  const deleteHierarchyLevel = useCallback(async (hierarchyId) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Check if level has children or assignments
      const hasChildren = hierarchies.some(h => h.parentHierarchyId === hierarchyId);
      const hasAssignments = assignments.some(a => a.hierarchyId === hierarchyId);

      if (hasChildren || hasAssignments) {
        throw new Error('Cannot delete level with children or door assignments');
      }

      const hierarchyRef = doc(db, 'mk_projects', mkProject.id, 'hierarchies', hierarchyId);
      await deleteDoc(hierarchyRef);
      console.log('Hierarchy level deleted successfully');
    } catch (err) {
      console.error('Failed to delete hierarchy level:', err);
      throw err;
    }
  }, [mkProject, hierarchies, assignments]);

  const applyHierarchyTemplate = useCallback(async (facilityType) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const recommendedLevels = getRecommendedHierarchy(standard, facilityType);

      // Clear existing hierarchies
      const existingHierarchies = await getDocs(
        collection(db, 'mk_projects', mkProject.id, 'hierarchies')
      );
      const batch = writeBatch(db);
      existingHierarchies.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Add recommended levels
      let previousId = null;
      for (let i = 0; i < recommendedLevels.length; i++) {
        const level = recommendedLevels[i];
        const hierarchyRef = collection(db, 'mk_projects', mkProject.id, 'hierarchies');
        const docRef = await addDoc(hierarchyRef, {
          levelName: level.name,
          levelType: level.id,
          keySymbol: level.symbol,
          order: i,
          parentHierarchyId: previousId,
          description: `${level.name} for ${facilityType}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        previousId = docRef.id;
      }

      console.log('Hierarchy template applied successfully');
    } catch (err) {
      console.error('Failed to apply hierarchy template:', err);
      throw err;
    }
  }, [mkProject, standard]);

  // =====================================================
  // ZONE MANAGEMENT FUNCTIONS
  // =====================================================
  const createZone = useCallback(async (zoneData) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const zoneRef = collection(db, 'mk_projects', mkProject.id, 'zones');
      const docRef = await addDoc(zoneRef, {
        ...zoneData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Zone created successfully');
      return docRef.id;
    } catch (err) {
      console.error('Failed to create zone:', err);
      throw err;
    }
  }, [mkProject]);

  const autoGenerateZones = useCallback(async (projectDoors, approach) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Generate zones based on approach
      const zoneMap = {};

      if (approach === 'zone_based') {
        // Group by door.zone field
        projectDoors.forEach(door => {
          if (!zoneMap[door.zone]) {
            zoneMap[door.zone] = { name: door.zone, doors: [] };
          }
          zoneMap[door.zone].doors.push(door.id);
        });
      } else if (approach === 'floor_based') {
        // Group by door.level field
        projectDoors.forEach(door => {
          const floorName = `Floor ${door.level}`;
          if (!zoneMap[floorName]) {
            zoneMap[floorName] = { name: floorName, doors: [] };
          }
          zoneMap[floorName].doors.push(door.id);
        });
      } else if (approach === 'functional') {
        // Group by door.use field
        projectDoors.forEach(door => {
          if (!zoneMap[door.use]) {
            zoneMap[door.use] = { name: door.use, doors: [] };
          }
          zoneMap[door.use].doors.push(door.id);
        });
      }

      // Create zones in Firestore
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      let colorIndex = 0;

      for (const [key, data] of Object.entries(zoneMap)) {
        await createZone({
          zoneName: data.name,
          color: colors[colorIndex % colors.length],
          doorCount: data.doors.length
        });
        colorIndex++;
      }

      console.log('Zones auto-generated successfully');
    } catch (err) {
      console.error('Failed to auto-generate zones:', err);
      throw err;
    }
  }, [mkProject, createZone]);

  const deleteZone = useCallback(async (zoneId) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const zoneRef = doc(db, 'mk_projects', mkProject.id, 'zones', zoneId);
      await deleteDoc(zoneRef);
      console.log('Zone deleted successfully');
    } catch (err) {
      console.error('Failed to delete zone:', err);
      throw err;
    }
  }, [mkProject]);

  // =====================================================
  // DIFFERS COUNT UPDATE
  // =====================================================
  const updateDiffersCount = useCallback(async () => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Calculate total unique keys in the system
      const uniqueKeys = new Set();

      // Add hierarchy keys (GMK, MK-1, MK-2, etc.)
      hierarchies.forEach(h => {
        uniqueKeys.add(h.keySymbol);
      });

      // Add change keys from assignments (CK-101, CK-102, etc.)
      assignments.forEach(a => {
        uniqueKeys.add(a.keySymbol);
      });

      const differsUsed = uniqueKeys.size;

      // Calculate total physical keys and cylinders
      let totalPhysicalKeys = 0;
      let totalCylinders = 0;

      // Add hierarchy key quantities (e.g., GMK: 3 keys, MK-1: 5 keys)
      hierarchies.forEach(h => {
        totalPhysicalKeys += h.keyQuantity || 2; // Default 2 keys per hierarchy level
      });

      // Add change key quantities
      // For KD doors: count individual door quantities
      // For KA groups: count group quantity once
      const countedKAGroups = new Set();

      assignments.forEach(a => {
        // Find the corresponding door from projectDoors to get actual quantity
        const door = projectDoors.find(d => d.id === a.doorId);
        const doorQty = door?.qty || 1; // Use actual door quantity from schedule

        if (a.keyType === 'KA' && a.kaGroupId) {
          // Only count KA group once
          if (!countedKAGroups.has(a.kaGroupId)) {
            const kaGroup = kaGroups.find(g => g.id === a.kaGroupId);
            if (kaGroup) {
              totalPhysicalKeys += kaGroup.keyQuantity || 0;
              countedKAGroups.add(a.kaGroupId);
            }
          }
        } else if (a.keyType === 'KD') {
          // KD: each door has its own keys
          totalPhysicalKeys += a.keyQuantity || 2;
        } else {
          // Legacy assignments without keyType (default to 2 keys)
          totalPhysicalKeys += a.keyQuantity || 2;
        }

        // Count cylinders using actual door quantity from schedule
        // Each door in the schedule can have multiple instances (qty field)
        totalCylinders += doorQty;
      });

      // Update mkProject document
      const mkProjectRef = doc(db, 'mk_projects', mkProject.id);
      await updateDoc(mkProjectRef, {
        differsUsed,
        totalPhysicalKeys,      // NEW: Total keys to manufacture
        totalCylinders,         // NEW: Total cylinders in system
        updatedAt: serverTimestamp()
      });

      console.log(`Differs updated: ${differsUsed} unique keys, ${totalPhysicalKeys} physical keys, ${totalCylinders} cylinders`);
    } catch (err) {
      console.error('Failed to update differs count:', err);
    }
  }, [mkProject, hierarchies, assignments, kaGroups, projectDoors]);

  // =====================================================
  // DOOR ASSIGNMENT FUNCTIONS
  // =====================================================
  const assignDoorToKey = useCallback(async (doorId, hierarchyId, keySymbol, options = {}) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    const {
      keyType = 'KD',           // 'KD' (Keyed Differ) or 'KA' (Keyed Alike)
      keyQuantity = 2,          // Default: 2 keys per door
      kaGroupId = null,         // KA Group ID (if KA type)
      kaGroupName = null        // KA Group Name (if KA type)
    } = options;

    try {
      const assignmentRef = collection(db, 'mk_projects', mkProject.id, 'assignments');
      await addDoc(assignmentRef, {
        doorId,
        hierarchyId,
        keySymbol,
        keyType,                // NEW: KD or KA
        keyQuantity,            // NEW: Number of physical keys
        kaGroupId,              // NEW: Link to KA group
        kaGroupName,            // NEW: Display name
        assignedAt: serverTimestamp()
      });

      // Update differs count
      await updateDiffersCount();

      console.log('Door assigned to key successfully:', keyType, keySymbol);
    } catch (err) {
      console.error('Failed to assign door:', err);
      throw err;
    }
  }, [mkProject, updateDiffersCount]);

  const bulkAssignDoors = useCallback(async (doorIds, hierarchyId, keySymbol) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const batch = writeBatch(db);
      const assignmentRef = collection(db, 'mk_projects', mkProject.id, 'assignments');

      doorIds.forEach(doorId => {
        const docRef = doc(assignmentRef);
        batch.set(docRef, {
          doorId,
          hierarchyId,
          keySymbol,
          assignedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log('Bulk door assignment completed successfully');
    } catch (err) {
      console.error('Failed to bulk assign doors:', err);
      throw err;
    }
  }, [mkProject]);

  const unassignDoor = useCallback(async (doorId) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Find the assignment document for this door
      const assignmentsRef = collection(db, 'mk_projects', mkProject.id, 'assignments');
      const assignmentsSnapshot = await getDocs(assignmentsRef);

      const assignmentDoc = assignmentsSnapshot.docs.find(doc => doc.data().doorId === doorId);

      if (assignmentDoc) {
        await deleteDoc(doc(db, 'mk_projects', mkProject.id, 'assignments', assignmentDoc.id));

        // Update differs count
        await updateDiffersCount();

        console.log('Door unassigned successfully');
      }
    } catch (err) {
      console.error('Failed to unassign door:', err);
      throw err;
    }
  }, [mkProject, updateDiffersCount]);

  // =====================================================
  // KA GROUP MANAGEMENT FUNCTIONS
  // =====================================================

  /**
   * Generate KA Group change key symbol
   * ANSI: AA10, AA20, AA30 (multiples of 10)
   * EN: CK-200, CK-300, CK-400 (multiples of 100)
   */
  const generateKASymbol = useCallback((masterKeySymbol, kaGroupIndex) => {
    if (standard === 'ANSI_BHMA') {
      // AA10, AA20, AA30...
      return `${masterKeySymbol}${(kaGroupIndex + 1) * 10}`;
    } else {
      // EN: CK-200, CK-300...
      const masterNum = masterKeySymbol.split('-')[1] || '1'; // MK-1 → 1
      return `CK-${masterNum}${(kaGroupIndex + 1) * 100}`;
    }
  }, [standard]);

  /**
   * Create a new KA (Keyed Alike) Group
   */
  const createKAGroup = useCallback(async (groupName, doorIds, masterKeyId, masterKeySymbol, keyQuantity = 5) => {
    if (!mkProject?.id) return;
    if (doorIds.length < 2) {
      throw new Error('KA group must have at least 2 doors');
    }

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Count existing KA groups for this master to generate symbol
      const existingKAGroups = kaGroups.filter(g => g.masterKeyId === masterKeyId);
      const kaGroupIndex = existingKAGroups.length;

      // Generate shared change key symbol
      const changeKeySymbol = generateKASymbol(masterKeySymbol, kaGroupIndex);

      // Create KA group document
      const kaGroupRef = collection(db, 'mk_projects', mkProject.id, 'ka_groups');
      const kaGroupDoc = await addDoc(kaGroupRef, {
        name: groupName,
        changeKeySymbol,
        masterKeyId,
        masterKeySymbol,
        doorIds,
        keyQuantity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update all doors in the group
      for (const doorId of doorIds) {
        // First, unassign if already assigned
        const existingAssignment = assignments.find(a => a.doorId === doorId);
        if (existingAssignment) {
          await deleteDoc(doc(db, 'mk_projects', mkProject.id, 'assignments', existingAssignment.assignmentId));
        }

        // Then assign with KA group info
        await assignDoorToKey(doorId, masterKeyId, changeKeySymbol, {
          keyType: 'KA',
          keyQuantity: 0, // Don't count quantity per door for KA
          kaGroupId: kaGroupDoc.id,
          kaGroupName: groupName
        });
      }

      console.log('KA Group created:', groupName, changeKeySymbol);
      return kaGroupDoc.id;
    } catch (err) {
      console.error('Failed to create KA group:', err);
      throw err;
    }
  }, [mkProject, kaGroups, assignments, generateKASymbol, assignDoorToKey, standard]);

  /**
   * Update KA Group (name or quantity)
   */
  const updateKAGroup = useCallback(async (kaGroupId, updates) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const kaGroupRef = doc(db, 'mk_projects', mkProject.id, 'ka_groups', kaGroupId);
      await updateDoc(kaGroupRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // If name changed, update all assignments
      if (updates.name) {
        const kaGroup = kaGroups.find(g => g.id === kaGroupId);
        if (kaGroup) {
          const batch = writeBatch(db);

          kaGroup.doorIds.forEach(doorId => {
            const assignment = assignments.find(a => a.doorId === doorId);
            if (assignment) {
              const assignmentRef = doc(db, 'mk_projects', mkProject.id, 'assignments', assignment.assignmentId);
              batch.update(assignmentRef, {
                kaGroupName: updates.name
              });
            }
          });

          await batch.commit();
        }
      }

      console.log('KA Group updated');
    } catch (err) {
      console.error('Failed to update KA group:', err);
      throw err;
    }
  }, [mkProject, kaGroups, assignments]);

  /**
   * Delete KA Group and convert doors back to KD
   */
  const deleteKAGroup = useCallback(async (kaGroupId) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const kaGroup = kaGroups.find(g => g.id === kaGroupId);
      if (!kaGroup) return;

      // Delete KA group document
      await deleteDoc(doc(db, 'mk_projects', mkProject.id, 'ka_groups', kaGroupId));

      // Unassign all doors in the group
      for (const doorId of kaGroup.doorIds) {
        const assignment = assignments.find(a => a.doorId === doorId);
        if (assignment) {
          await deleteDoc(doc(db, 'mk_projects', mkProject.id, 'assignments', assignment.assignmentId));
        }
      }

      console.log('KA Group deleted');
    } catch (err) {
      console.error('Failed to delete KA group:', err);
      throw err;
    }
  }, [mkProject, kaGroups, assignments]);

  /**
   * Update key quantity for a single KD door
   */
  const updateKeyQuantity = useCallback(async (doorId, newQuantity) => {
    if (!mkProject?.id) return;
    if (newQuantity < 1) {
      throw new Error('Key quantity must be at least 1');
    }

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const assignment = assignments.find(a => a.doorId === doorId);
      if (!assignment) {
        throw new Error('Door not assigned');
      }

      const assignmentRef = doc(db, 'mk_projects', mkProject.id, 'assignments', assignment.assignmentId);
      await updateDoc(assignmentRef, {
        keyQuantity: newQuantity
      });

      console.log('Key quantity updated:', doorId, newQuantity);
    } catch (err) {
      console.error('Failed to update key quantity:', err);
      throw err;
    }
  }, [mkProject, assignments]);

  // =====================================================
  // VALIDATION FUNCTION
  // =====================================================
  const validateDesign = useCallback(async (projectDoors, facilityType) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      const errors = [];
      const warnings = [];

      // Check 1: All doors assigned
      const unassignedDoors = projectDoors.filter(
        door => !assignments.some(a => a.doorId === door.id)
      );
      if (unassignedDoors.length > 0) {
        errors.push({
          type: 'unassigned_doors',
          severity: 'error',
          message: `${unassignedDoors.length} doors not assigned to any key`,
          count: unassignedDoors.length
        });
      }

      // Check 2: Differs limit
      if (mkProject.differsUsed > mkProject.maxDiffersAvailable) {
        errors.push({
          type: 'exceeds_differs',
          severity: 'error',
          message: 'Design exceeds available differs',
          details: `${mkProject.differsUsed} > ${mkProject.maxDiffersAvailable}`
        });
      }

      // Check 3: Hierarchy completeness
      if (hierarchies.length === 0) {
        errors.push({
          type: 'no_hierarchy',
          severity: 'error',
          message: 'No hierarchy levels defined'
        });
      }

      // Check 4: Critical standards compliance only (simplified for users)
      // Only check critical issues, not detailed format validation
      const standardsValidation = validateStandardsCompliance(
        hierarchies,
        assignments,
        standard,
        facilityType
      );

      // Only add critical errors (filter out format validation)
      const criticalErrors = standardsValidation.errors.filter(e =>
        e.type === 'exceeds_maximum_depth' ||
        e.type === 'insufficient_depth' ||
        e.type === 'invalid_parent_child_pairing'
      );

      errors.push(...criticalErrors.map(e => ({
        ...e,
        severity: 'error'
      })));

      // Only add important warnings (filter out sequence gaps and unusual pairings)
      const importantWarnings = standardsValidation.warnings.filter(w =>
        w.type === 'excessive_depth' ||
        w.type === 'below_facility_minimum' ||
        w.type === 'above_facility_maximum'
      );

      warnings.push(...importantWarnings.map(w => ({
        ...w,
        severity: 'warning'
      })));

      // Save validation results
      const validationRef = collection(db, 'mk_projects', mkProject.id, 'validations');
      await addDoc(validationRef, {
        errors,
        warnings,
        validatedAt: serverTimestamp(),
        isValid: errors.length === 0
      });

      console.log('Validation completed:', { errors: errors.length, warnings: warnings.length });
      return { errors, warnings, isValid: errors.length === 0 };
    } catch (err) {
      console.error('Validation failed:', err);
      throw err;
    }
  }, [mkProject, assignments, hierarchies, standard]);

  // =====================================================
  // EXPORT FUNCTION
  // =====================================================
  const generateExport = useCallback(async (format, options, projectDoors) => {
    if (!mkProject?.id) return;

    // Ensure Firebase Auth is ready before accessing Firestore
    await ensureAuth();

    try {
      // Generate export data
      const exportData = {
        project: mkProject,
        hierarchies,
        zones,
        assignments,
        doors: projectDoors,
        standard: STANDARDS[standard],
        generatedAt: new Date().toISOString()
      };

      // Save export record
      const exportRef = collection(db, 'mk_projects', mkProject.id, 'exports');
      await addDoc(exportRef, {
        format,
        options,
        generatedAt: serverTimestamp()
      });

      console.log('Export generated successfully');
      // Return data for client-side generation
      return exportData;
    } catch (err) {
      console.error('Export generation failed:', err);
      throw err;
    }
  }, [mkProject, hierarchies, zones, assignments, standard]);

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
  const value = {
    // Project-level state
    projectId,
    mkSystemEnabled,
    mkApproach,
    standard,
    toggleMKSystem,
    updateMKApproach,
    updateStandard,
    updateMKProject,

    // MK Project state
    mkProject,
    hierarchies,
    hierarchyTree,
    zones,
    assignments,
    kaGroups,              // NEW: KA Groups
    validationIssues,
    loading,
    error,

    // Hierarchy management functions
    addHierarchyLevel,
    updateHierarchyLevel,
    deleteHierarchyLevel,
    applyHierarchyTemplate,

    // Zone management functions
    createZone,
    autoGenerateZones,
    deleteZone,

    // Door assignment functions
    assignDoorToKey,
    bulkAssignDoors,
    unassignDoor,

    // KA Group management functions (NEW)
    createKAGroup,
    updateKAGroup,
    deleteKAGroup,
    updateKeyQuantity,
    generateKASymbol,

    // Validation function
    validateDesign,

    // Export function
    generateExport,

    // Computed values
    statistics: mkProject?.statistics || {
      totalDoors: 0,
      keyedDoors: 0,
      unkeyedDoors: 0,
      totalKeys: 0,
      zonesDefined: 0,
    },
    isComplete: mkProject?.mkSystemStatus === 'completed',
    differsRemaining: (mkProject?.maxDiffersAvailable || 0) - (mkProject?.differsUsed || 0),
    differsUsagePercentage: mkProject?.maxDiffersAvailable
      ? ((mkProject.differsUsed / mkProject.maxDiffersAvailable) * 100).toFixed(1)
      : 0,
  };

  return (
    <MasterKeyContext.Provider value={value}>
      {children}
    </MasterKeyContext.Provider>
  );
};

export default MasterKeyContext;
