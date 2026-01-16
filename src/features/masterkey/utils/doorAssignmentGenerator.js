/**
 * Door Assignment Generator Utility
 *
 * Intelligently assigns doors to master keys and generates change keys
 * based on zone-to-master matching and standard-specific naming
 */

/**
 * Match zones to master keys by name similarity
 */
export const matchZoneToMaster = (zoneName, masters) => {
  // Try exact match first
  let master = masters.find(m =>
    m.levelName.toLowerCase() === zoneName.toLowerCase() ||
    m.levelName.toLowerCase().includes(zoneName.toLowerCase())
  );

  // If no match, try partial match
  if (!master) {
    const zoneWords = zoneName.toLowerCase().split(/\s+/);
    master = masters.find(m => {
      const masterWords = m.levelName.toLowerCase().split(/\s+/);
      return zoneWords.some(zw => masterWords.some(mw => mw.includes(zw) || zw.includes(mw)));
    });
  }

  return master;
};

/**
 * Generate change key symbol based on standard and master
 */
export const generateChangeKeySymbol = (standard, masterSymbol, doorIndex, masterId) => {
  if (standard === 'ANSI_BHMA') {
    // ANSI pattern: AA1, AA2, AB1, AB2
    return `${masterSymbol}${doorIndex + 1}`;
  } else {
    // EN pattern: CK-101, CK-102, CK-201, CK-202
    // Extract master number from symbol (MK-1 → 1, MK-2 → 2)
    const masterMatch = masterSymbol.match(/(\d+)/);
    const masterNum = masterMatch ? masterMatch[1] : '1';
    const doorNum = String(doorIndex + 1).padStart(2, '0');
    return `CK-${masterNum}${doorNum}`;
  }
};

/**
 * Generate change key name based on door info
 */
export const generateChangeKeyName = (door, zone) => {
  if (door.mark) {
    return `Door ${door.mark} Key`;
  } else if (door.use) {
    return `${door.use} Key`;
  } else if (zone) {
    return `${zone} Key ${door.id.slice(-4)}`;
  }
  return `Change Key ${door.id.slice(-4)}`;
};

/**
 * Get parent master keys for a given master in hierarchy
 */
export const getParentMasters = (masterId, hierarchies) => {
  const parents = [];
  let currentMaster = hierarchies.find(h => h.hierarchyId === masterId);

  while (currentMaster && currentMaster.parentHierarchyId) {
    const parent = hierarchies.find(h => h.hierarchyId === currentMaster.parentHierarchyId);
    if (parent) {
      parents.push(parent);
      currentMaster = parent;
    } else {
      break;
    }
  }

  // Also find the top-level Grand Master
  const topLevel = hierarchies.find(h => !h.parentHierarchyId && h.hierarchyId !== masterId);
  if (topLevel && !parents.some(p => p.hierarchyId === topLevel.hierarchyId)) {
    parents.push(topLevel);
  }

  return parents;
};

/**
 * Generate auto-assignment plan
 */
export const generateAutoAssignmentPlan = (projectDoors, zones, hierarchies, standard) => {
  const plan = {
    assignments: [],
    changeKeys: [],
    masterCounts: {},
    totalChangeKeys: 0,
    unassignedDoors: []
  };

  // Find Level 2 masters (MK-1, MK-2, AA, AB, etc.)
  const masters = hierarchies.filter(h => h.order > 0 && h.order <= hierarchies.length - 1);

  // Group doors by zone
  const doorsByZone = {};
  projectDoors.forEach(door => {
    const zoneName = door.zone || 'Unassigned';
    if (!doorsByZone[zoneName]) {
      doorsByZone[zoneName] = [];
    }
    doorsByZone[zoneName].push(door);
  });

  // For each zone, find matching master and create assignments
  Object.entries(doorsByZone).forEach(([zoneName, doors]) => {
    const master = matchZoneToMaster(zoneName, masters);

    if (!master) {
      // No matching master found, add to unassigned
      plan.unassignedDoors.push(...doors);
      return;
    }

    // Initialize master count
    if (!plan.masterCounts[master.hierarchyId]) {
      plan.masterCounts[master.hierarchyId] = {
        master,
        count: 0,
        zoneName
      };
    }

    // Get parent masters (GMK, etc.)
    const parentMasters = getParentMasters(master.hierarchyId, hierarchies);

    // Create assignments for each door in this zone
    doors.forEach((door, index) => {
      const changeKeySymbol = generateChangeKeySymbol(
        standard,
        master.keySymbol,
        plan.masterCounts[master.hierarchyId].count,
        master.hierarchyId
      );

      const changeKeyName = generateChangeKeyName(door, zoneName);

      const assignment = {
        doorId: door.id,
        door,
        changeKeySymbol,
        changeKeyName,
        masterKeyId: master.hierarchyId,
        masterKeySymbol: master.keySymbol,
        masterKeyName: master.levelName,
        parentMasterKeys: parentMasters.map(p => ({
          id: p.hierarchyId,
          symbol: p.keySymbol,
          name: p.levelName
        })),
        zoneName
      };

      plan.assignments.push(assignment);
      plan.changeKeys.push({
        symbol: changeKeySymbol,
        name: changeKeyName,
        doorId: door.id,
        masterKeyId: master.hierarchyId,
        zoneName
      });

      plan.masterCounts[master.hierarchyId].count++;
      plan.totalChangeKeys++;
    });
  });

  return plan;
};

/**
 * Format assignment plan for preview display
 */
export const formatAssignmentPreview = (plan, hierarchies, standard) => {
  const isANSI = standard === 'ANSI_BHMA';

  let preview = `This will create:\n\n`;

  // Top-level master
  const topMaster = hierarchies.find(h => !h.parentHierarchyId);
  if (topMaster) {
    preview += `**${topMaster.levelName} (${topMaster.keySymbol})**\n`;
    preview += `• Opens all ${plan.totalChangeKeys} door${plan.totalChangeKeys !== 1 ? 's' : ''}\n\n`;
  }

  // Level 2 masters
  preview += `**${isANSI ? 'Master Keys' : 'Master Keys'}:**\n`;
  Object.values(plan.masterCounts).forEach(({ master, count, zoneName }) => {
    preview += `• ${master.keySymbol} (${master.levelName}) - ${count} door${count !== 1 ? 's' : ''}\n`;

    // Show first 3 change keys as example
    const changeKeys = plan.changeKeys
      .filter(ck => ck.masterKeyId === master.hierarchyId)
      .slice(0, 3);

    if (changeKeys.length > 0) {
      preview += `  └─ Change Keys: ${changeKeys.map(ck => ck.symbol).join(', ')}`;
      if (count > 3) {
        preview += `... (${count - 3} more)`;
      }
      preview += '\n';
    }
  });

  // Unassigned doors warning
  if (plan.unassignedDoors.length > 0) {
    preview += `\n⚠️ **${plan.unassignedDoors.length} door${plan.unassignedDoors.length !== 1 ? 's' : ''} could not be auto-assigned**\n`;
    preview += `These doors have no matching zone/master. You'll need to assign them manually.\n`;
  }

  // Totals
  preview += `\n**Total Change Keys:** ${plan.totalChangeKeys}\n`;
  const masterCount = Object.keys(plan.masterCounts).length;
  const topCount = topMaster ? 1 : 0;
  preview += `**Total Keys in System:** ${topCount + masterCount + plan.totalChangeKeys}\n`;
  preview += `(${topCount} ${isANSI ? 'GMK' : 'GMK'} + ${masterCount} ${isANSI ? 'MK' : 'MK'} + ${plan.totalChangeKeys} ${isANSI ? 'CK' : 'CK'})\n`;

  return preview;
};

/**
 * Calculate current assignment statistics
 */
export const calculateAssignmentStats = (assignments, hierarchies, projectDoors) => {
  const stats = {
    totalDoors: projectDoors.length,
    assignedDoors: assignments.length,
    unassignedDoors: projectDoors.length - assignments.length,
    progressPercentage: projectDoors.length > 0
      ? Math.round((assignments.length / projectDoors.length) * 100)
      : 0,
    masterStats: {}
  };

  // Count assignments per master
  hierarchies.forEach(hierarchy => {
    const masterAssignments = assignments.filter(a => {
      // Check if this hierarchy is the direct master OR a parent master
      return a.hierarchyId === hierarchy.hierarchyId;
    });

    stats.masterStats[hierarchy.hierarchyId] = {
      hierarchy,
      assignedCount: masterAssignments.length,
      symbol: hierarchy.keySymbol,
      name: hierarchy.levelName
    };
  });

  return stats;
};
