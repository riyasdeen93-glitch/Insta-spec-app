/**
 * Hierarchy Generator Utility
 *
 * Generates master key hierarchy structures based on:
 * - Selected standard (ANSI/BHMA or EN 1303)
 * - Hierarchy levels (2, 3, or 4 levels)
 * - Keying approach (zone_based, floor_based, functional)
 * - Door data for smart estimations
 */

import { STANDARDS } from './standards';

/**
 * Generate key symbol based on standard, level, and index
 */
export const generateKeySymbol = (standard, level, index, parentSymbol = '') => {
  if (standard === 'ANSI_BHMA') {
    // ANSI Pattern: A, AA, AAA, AA1, AB1, etc.
    if (level === 1) {
      // Great Grand Master or Grand Master
      return 'A';
    } else if (level === 2) {
      // Grand Master or Master Keys: AA, AB, AC, AD...
      return 'A' + String.fromCharCode(65 + index); // AA, AB, AC
    } else if (level === 3) {
      // Master or Sub-Master Keys: AAA, AAB, AAC...
      if (parentSymbol) {
        return parentSymbol + String.fromCharCode(65 + index);
      }
      return 'AA' + String.fromCharCode(65 + index);
    } else if (level === 4) {
      // Change Keys: AAA1, AAA2, AAB1...
      if (parentSymbol) {
        return `${parentSymbol}${index + 1}`;
      }
      return `AAA${index + 1}`;
    }
  } else {
    // EN Pattern: GMK, MK-1, CK-101, etc.
    if (level === 1) {
      // Great General Master or General Master
      return 'GMK';
    } else if (level === 2) {
      // Master Keys: MK-1, MK-2, MK-3...
      return `MK-${index + 1}`;
    } else if (level === 3) {
      // Sub-Keys: SK-1, SK-2 or User Keys directly
      return `SK-${index + 1}`;
    } else if (level === 4) {
      // User/Change Keys: CK-101, CK-201...
      return `CK-${(index * 100) + 1}`;
    }
  }

  return `KEY-${level}-${index}`;
};

/**
 * Generate level name based on standard, level, and approach
 */
export const generateLevelName = (standard, level, approach, index, zoneName = null) => {
  const isANSI = standard === 'ANSI_BHMA';

  if (level === 1) {
    return isANSI ? 'Grand Master Key' : 'General Master Key';
  }

  if (level === 2) {
    // Master Keys - name based on approach
    if (approach === 'zone_based' && zoneName) {
      return `${zoneName} Master`;
    } else if (approach === 'floor_based') {
      return `Floor ${index + 1} Master`;
    } else if (approach === 'functional') {
      const departments = ['Administration', 'Operations', 'Facilities', 'Security', 'Services', 'Staff'];
      return `${departments[index % departments.length]} Master`;
    } else {
      return `Master Key ${index + 1}`;
    }
  }

  if (level === 3) {
    // Sub-Master or Change Keys
    if (zoneName) {
      return `${zoneName} Sub-Master`;
    }
    return isANSI ? 'Sub-Master Key' : 'Sub-Key';
  }

  if (level === 4) {
    return isANSI ? 'Change Key' : 'User Key';
  }

  return `Level ${level} Key`;
};

/**
 * Estimate number of master keys needed based on door data and approach
 */
export const estimateMasterCount = (projectDoors, approach) => {
  if (!projectDoors || projectDoors.length === 0) {
    return 3; // Default to 3 masters
  }

  let count = 0;

  if (approach === 'zone_based') {
    // Count unique zones
    const zones = new Set(projectDoors.map(door => door.zone).filter(Boolean));
    count = zones.size;
  } else if (approach === 'floor_based') {
    // Count unique floors
    const floors = new Set(projectDoors.map(door => door.level).filter(Boolean));
    count = floors.size;
  } else if (approach === 'functional') {
    // Count unique uses/functions
    const uses = new Set(projectDoors.map(door => door.use).filter(Boolean));
    count = Math.min(uses.size, 6); // Max 6 functional groups
  } else {
    // Default: estimate based on door count
    count = Math.ceil(projectDoors.length / 30); // ~30 doors per master
  }

  // Enforce min/max bounds
  return Math.max(2, Math.min(count, 10));
};

/**
 * Get unique zone/floor names from door data
 */
export const getGroupNames = (projectDoors, approach) => {
  if (!projectDoors || projectDoors.length === 0) {
    return [];
  }

  if (approach === 'zone_based') {
    const zones = [...new Set(projectDoors.map(door => door.zone).filter(Boolean))];
    return zones.sort();
  } else if (approach === 'floor_based') {
    const floors = [...new Set(projectDoors.map(door => door.level).filter(Boolean))];
    return floors.sort();
  } else if (approach === 'functional') {
    const uses = [...new Set(projectDoors.map(door => door.use).filter(Boolean))];
    return uses.slice(0, 6).sort(); // Limit to 6
  }

  return [];
};

/**
 * Calculate door count per group
 */
export const calculateDoorsPerGroup = (projectDoors, approach, groupName) => {
  if (!projectDoors || projectDoors.length === 0) {
    return 0;
  }

  if (approach === 'zone_based') {
    return projectDoors.filter(door => door.zone === groupName).length;
  } else if (approach === 'floor_based') {
    return projectDoors.filter(door => door.level === groupName).length;
  } else if (approach === 'functional') {
    return projectDoors.filter(door => door.use === groupName).length;
  }

  return Math.ceil(projectDoors.length / 4);
};

/**
 * Generate complete hierarchy structure preview
 */
export const generateHierarchyPreview = (standard, hierarchyLevels, approach, projectDoors, facilityType) => {
  const preview = {
    standard,
    hierarchyLevels,
    approach,
    totalDoors: projectDoors?.length || 0,
    levels: [],
    estimatedTotalKeys: 0
  };

  const masterCount = estimateMasterCount(projectDoors, approach);
  const groupNames = getGroupNames(projectDoors, approach);

  // Level 1: Top-level master (always 1 key)
  const level1 = {
    level: 1,
    name: generateLevelName(standard, 1, approach, 0),
    symbol: generateKeySymbol(standard, 1, 0),
    description: `Opens all ${preview.totalDoors} doors`,
    count: 1,
    keys: [{
      symbol: generateKeySymbol(standard, 1, 0),
      name: generateLevelName(standard, 1, approach, 0)
    }]
  };
  preview.levels.push(level1);
  preview.estimatedTotalKeys += 1;

  if (hierarchyLevels >= 2) {
    // Level 2: Masters (multiple keys based on approach)
    const level2Keys = [];
    for (let i = 0; i < masterCount; i++) {
      const groupName = groupNames[i] || null;
      const doorCount = groupName ? calculateDoorsPerGroup(projectDoors, approach, groupName) : 0;

      level2Keys.push({
        symbol: generateKeySymbol(standard, 2, i),
        name: generateLevelName(standard, 2, approach, i, groupName),
        doorCount
      });
    }

    const level2 = {
      level: 2,
      name: standard === 'ANSI_BHMA' ? 'Master Keys' : 'Master Keys',
      description: `${masterCount} master keys for ${approach.replace('_', ' ')} organization`,
      count: masterCount,
      keys: level2Keys
    };
    preview.levels.push(level2);
    preview.estimatedTotalKeys += masterCount;
  }

  if (hierarchyLevels >= 3) {
    // Level 3: Sub-Masters or Change Keys
    const changeKeyCount = preview.totalDoors || masterCount * 30;

    const level3 = {
      level: 3,
      name: standard === 'ANSI_BHMA' ? 'Change Keys' : 'User Keys',
      description: 'Created automatically when doors are assigned',
      count: changeKeyCount,
      keys: [] // Generated dynamically
    };
    preview.levels.push(level3);
    preview.estimatedTotalKeys += changeKeyCount;
  }

  if (hierarchyLevels >= 4) {
    // Level 4: Change Keys (for 4-level systems)
    const changeKeyCount = preview.totalDoors || masterCount * 30;

    const level4 = {
      level: 4,
      name: standard === 'ANSI_BHMA' ? 'Change Keys' : 'User Keys',
      description: 'Individual room/door keys',
      count: changeKeyCount,
      keys: []
    };
    preview.levels.push(level4);
    // Don't double-count if we added them in level 3
  }

  return preview;
};

/**
 * Generate hierarchy levels for Firestore
 */
export const generateHierarchyLevels = (standard, hierarchyLevels, approach, projectDoors, facilityType) => {
  const levels = [];
  const masterCount = estimateMasterCount(projectDoors, approach);
  const groupNames = getGroupNames(projectDoors, approach);

  // Level 1: Top-level master
  levels.push({
    levelName: generateLevelName(standard, 1, approach, 0),
    levelType: hierarchyLevels === 4 ? 'GGM' : 'GMK',
    keySymbol: generateKeySymbol(standard, 1, 0),
    order: 0,
    parentHierarchyId: null,
    description: `${generateLevelName(standard, 1, approach, 0)} - Opens all doors in ${facilityType}`,
    autoGenerated: true
  });

  if (hierarchyLevels >= 2) {
    // Level 2: Masters
    for (let i = 0; i < masterCount; i++) {
      const groupName = groupNames[i] || `Group ${i + 1}`;

      levels.push({
        levelName: generateLevelName(standard, 2, approach, i, groupName),
        levelType: hierarchyLevels === 4 ? 'GMK' : 'MK',
        keySymbol: generateKeySymbol(standard, 2, i),
        order: i + 1,
        parentHierarchyId: null, // Will be set after level 1 is created
        description: `Master key for ${groupName}`,
        autoGenerated: true
      });
    }
  }

  if (hierarchyLevels >= 3) {
    // Level 3: Sub-Masters or first level of change keys
    // These are typically created on-demand when doors are assigned
    // So we don't pre-generate them, just document the structure
  }

  return levels;
};

/**
 * Get hierarchy level description
 */
export const getHierarchyDescription = (standard, hierarchyLevels) => {
  const isANSI = standard === 'ANSI_BHMA';

  if (hierarchyLevels === 2) {
    return isANSI
      ? '2-Level System: Master → Change Keys'
      : '2-Level System: Master → User Keys';
  } else if (hierarchyLevels === 3) {
    return isANSI
      ? '3-Level System: Grand Master → Master → Change'
      : '3-Level System: General Master → Master → User';
  } else if (hierarchyLevels === 4) {
    return isANSI
      ? '4-Level System: Great GM → Grand Master → Master → Change'
      : '4-Level System: Great GM → General Master → Master → User';
  } else {
    return 'Single Key System (SKD/KD)';
  }
};
