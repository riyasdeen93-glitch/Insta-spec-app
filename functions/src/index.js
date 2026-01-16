/**
 * InstaSpec Master Key System - Cloud Functions
 *
 * This file contains Firebase Cloud Functions for the Master Key System.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// =====================================================
// MASTER KEY PROJECT MANAGEMENT
// =====================================================

/**
 * Enable MK System for a Project
 *
 * Creates an mk_projects document when user enables MK system.
 * This is called automatically by a Firestore trigger when
 * mkSystemEnabled changes from false to true.
 */
exports.onMKSystemEnabled = functions.firestore
  .document('projects/{projectId}')
  .onUpdate(async (change, context) => {
    const { projectId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Check if MK system was just enabled
    const wasEnabled = before.mkSystemEnabled === true;
    const isEnabled = after.mkSystemEnabled === true;

    if (!wasEnabled && isEnabled && !after.mkProjectId) {
      console.log(`Creating MK project for project ${projectId}`);

      try {
        // Create mk_projects document
        const mkProjectRef = db.collection('mk_projects').doc();

        // Calculate max differs (7 depths ^ 6 pins = 117,649)
        const pinConfig = {
          pins: 6,
          depths: 7,
          macs: 4
        };
        const maxDiffers = Math.pow(pinConfig.depths, pinConfig.pins);

        await mkProjectRef.set({
          projectId,
          keyingApproach: after.mkApproach || 'zone_based',
          hierarchyLevels: 4,
          maxDiffersAvailable: maxDiffers,
          differsUsed: 0,
          manufacturer: 'Schlage', // TODO: Get from hardware sets
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
          createdBy: context.auth?.uid || 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: null,
        });

        // Update project with mkProjectId
        await change.after.ref.update({
          mkProjectId: mkProjectRef.id,
        });

        console.log(`MK project created: ${mkProjectRef.id}`);

        return { success: true, mkProjectId: mkProjectRef.id };
      } catch (error) {
        console.error('Error creating MK project:', error);
        throw new functions.https.HttpsError('internal', error.message);
      }
    }

    // Check if MK system was disabled
    if (wasEnabled && !isEnabled && after.mkProjectId) {
      console.log(`Deleting MK project for project ${projectId}`);

      try {
        // Delete mk_projects document and all subcollections
        const mkProjectId = after.mkProjectId;
        await deleteMKProjectData(mkProjectId);

        // Update project
        await change.after.ref.update({
          mkProjectId: null,
          mkSystemStatus: null,
        });

        console.log(`MK project deleted: ${mkProjectId}`);

        return { success: true, deleted: mkProjectId };
      } catch (error) {
        console.error('Error deleting MK project:', error);
        throw new functions.https.HttpsError('internal', error.message);
      }
    }

    return null;
  });

/**
 * Helper: Delete MK Project and all subcollections
 */
async function deleteMKProjectData(mkProjectId) {
  const batch = db.batch();
  const collections = ['hierarchies', 'assignments', 'zones', 'door_zones', 'exports', 'audit_log'];

  // Delete all subcollections
  for (const collectionName of collections) {
    const snapshot = await db
      .collection('mk_projects').doc(mkProjectId)
      .collection(collectionName)
      .get();

    snapshot.docs.forEach(doc => batch.delete(doc.ref));
  }

  // Delete mk_project document
  batch.delete(db.collection('mk_projects').doc(mkProjectId));

  await batch.commit();
}

// =====================================================
// STATISTICS UPDATE TRIGGER
// =====================================================

/**
 * Update MK Project Statistics
 *
 * Automatically updates statistics when assignments change
 */
exports.onAssignmentChange = functions.firestore
  .document('mk_projects/{mkProjectId}/assignments/{assignmentId}')
  .onWrite(async (change, context) => {
    const { mkProjectId } = context.params;

    try {
      // Count unique doors assigned
      const assignmentsSnap = await db
        .collection('mk_projects').doc(mkProjectId)
        .collection('assignments')
        .get();

      const uniqueDoors = new Set(assignmentsSnap.docs.map(doc => doc.data().doorId));
      const keyedDoors = uniqueDoors.size;

      // Update statistics
      await db.collection('mk_projects').doc(mkProjectId).update({
        'statistics.keyedDoors': keyedDoors,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Updated statistics for MK project ${mkProjectId}: ${keyedDoors} keyed doors`);

      return { success: true };
    } catch (error) {
      console.error('Error updating statistics:', error);
      return { success: false, error: error.message };
    }
  });

// =====================================================
// AUDIT LOG TRIGGER
// =====================================================

/**
 * Create Audit Log Entries
 *
 * Automatically logs changes to hierarchies
 */
exports.onHierarchyChange = functions.firestore
  .document('mk_projects/{mkProjectId}/hierarchies/{hierarchyId}')
  .onWrite(async (change, context) => {
    const { mkProjectId, hierarchyId } = context.params;

    let actionType;
    if (!change.before.exists) actionType = 'create';
    else if (!change.after.exists) actionType = 'delete';
    else actionType = 'update';

    try {
      await db
        .collection('mk_projects').doc(mkProjectId)
        .collection('audit_log')
        .add({
          mkProjectId,
          actionType,
          entityType: 'hierarchy',
          entityId: hierarchyId,
          oldValues: change.before.data() || null,
          newValues: change.after.data() || null,
          changeSummary: `Hierarchy ${actionType}d`,
          userId: context.auth?.uid || 'system',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true };
    } catch (error) {
      console.error('Error creating audit log:', error);
      return { success: false, error: error.message };
    }
  });

// =====================================================
// CALLABLE FUNCTIONS (for future use)
// =====================================================

/**
 * Validate MK Project
 *
 * Runs validation checks on the MK project
 */
exports.validateMKProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { mkProjectId } = data;

  try {
    const mkProjectSnap = await db.collection('mk_projects').doc(mkProjectId).get();
    if (!mkProjectSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'MK project not found');
    }

    const mkProject = mkProjectSnap.data();
    const issues = [];

    // Check 1: Unkeyed doors
    const totalDoors = mkProject.statistics?.totalDoors || 0;
    const keyedDoors = mkProject.statistics?.keyedDoors || 0;

    if (keyedDoors < totalDoors) {
      issues.push({
        issueType: 'error',
        ruleName: 'Unkeyed Doors',
        message: `${totalDoors - keyedDoors} doors are not assigned to any key`,
        recommendation: 'Assign all doors before finalizing',
      });
    }

    // Check 2: Differ capacity
    const usagePercentage = (mkProject.differsUsed / mkProject.maxDiffersAvailable) * 100;
    if (usagePercentage > 80) {
      issues.push({
        issueType: 'warning',
        ruleName: 'Insufficient Differs',
        message: `You have used over ${usagePercentage.toFixed(1)}% of available differs`,
        recommendation: 'Consider revising hierarchy structure',
      });
    }

    const validationStatus = issues.some(i => i.issueType === 'error') ? 'error' :
                            issues.some(i => i.issueType === 'warning') ? 'warning' : 'success';

    return {
      success: true,
      validationStatus,
      totalIssues: issues.length,
      issues,
      summary: {
        errors: issues.filter(i => i.issueType === 'error').length,
        warnings: issues.filter(i => i.issueType === 'warning').length,
        info: issues.filter(i => i.issueType === 'info').length,
      },
    };
  } catch (error) {
    console.error('Error validating MK project:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

console.log('InstaSpec Master Key Cloud Functions loaded');
