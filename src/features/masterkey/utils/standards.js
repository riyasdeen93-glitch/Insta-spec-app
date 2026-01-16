// Master Key System Standards Configuration
// ANSI/BHMA A156.28-2023 and EN 1303:2015

export const STANDARDS = {
  ANSI_BHMA: {
    id: 'ANSI_BHMA',
    name: 'ANSI/BHMA A156.28',
    version: '2023',
    region: 'North America',
    pinConfig: { pins: 6, depths: 7, macs: 4 },
    maxDiffers: 117649, // 7^6
    hierarchyLevels: [
      { id: 'GGM', name: 'Great Grand Master', symbol: 'A', order: 0 },
      { id: 'GMK', name: 'Grand Master', symbol: 'AA', order: 1 },
      { id: 'MK', name: 'Master Key', symbol: 'AAA', order: 2 },
      { id: 'SMK', name: 'Sub-Master', symbol: 'AAAA', order: 3 },
      { id: 'CK', name: 'Change Key', symbol: 'AAAAA', order: 4 }
    ],
    securityGrades: ['Grade 1', 'Grade 2', 'Grade 3'],
    recommendations: {
      'Commercial Office': { depth: 3, levels: ['GMK', 'MK', 'CK'] },
      'Hospital / Healthcare': { depth: 4, levels: ['GMK', 'MK', 'SMK', 'CK'] },
      'Education / School': { depth: 3, levels: ['GMK', 'MK', 'CK'] },
      'Airport / Transport': { depth: 4, levels: ['GMK', 'MK', 'SMK', 'CK'] },
      'Hospitality / Hotel': { depth: 4, levels: ['GMK', 'MK', 'SMK', 'CK'] },
      'Residential': { depth: 2, levels: ['MK', 'CK'] }
    }
  },
  EN: {
    id: 'EN',
    name: 'EN 1303',
    version: '2015',
    region: 'Europe',
    pinConfig: { pins: 5, depths: 6, macs: 3 },
    maxDiffers: 7776, // 6^5
    hierarchyLevels: [
      { id: 'GM', name: 'General Master', symbol: 'GM', order: 0 },
      { id: 'MK', name: 'Master Key', symbol: 'M', order: 1 },
      { id: 'SK', name: 'Sub-Key', symbol: 'S', order: 2 },
      { id: 'UK', name: 'User Key', symbol: 'U', order: 3 }
    ],
    securityGrades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
    recommendations: {
      'Commercial Office': { depth: 2, levels: ['MK', 'UK'] },
      'Hospital / Healthcare': { depth: 3, levels: ['GM', 'MK', 'UK'] },
      'Education / School': { depth: 2, levels: ['MK', 'UK'] },
      'Airport / Transport': { depth: 3, levels: ['GM', 'MK', 'UK'] },
      'Hospitality / Hotel': { depth: 3, levels: ['GM', 'MK', 'UK'] },
      'Residential': { depth: 2, levels: ['MK', 'UK'] }
    }
  }
};

/**
 * Get standard configuration by ID
 * @param {string} standardId - 'ANSI_BHMA' or 'EN'
 * @returns {Object} Standard configuration
 */
export const getStandardConfig = (standardId) => {
  return STANDARDS[standardId] || STANDARDS.ANSI_BHMA;
};

/**
 * Calculate maximum available differs based on pin configuration
 * @param {number} pins - Number of pins in the cylinder
 * @param {number} depths - Number of available bitting depths
 * @returns {number} Maximum differs
 */
export const calculateMaxDiffers = (pins, depths) => {
  return Math.pow(depths, pins);
};

/**
 * Generate a key symbol based on level and index
 * @param {Object} level - Hierarchy level object
 * @param {number} index - Key index within level
 * @param {string} parentSymbol - Parent level's symbol
 * @returns {string} Generated key symbol
 */
export const generateKeySymbol = (level, index, parentSymbol = '') => {
  // ANSI: A, AA, AAA pattern with numeric suffix
  // EN: GM1, M1, S1, U1 pattern
  if (parentSymbol) {
    return `${parentSymbol}-${level.symbol}${index}`;
  }
  return `${level.symbol}${index}`;
};

/**
 * Get recommended hierarchy levels for a facility type and standard
 * @param {string} standardId - 'ANSI_BHMA' or 'EN'
 * @param {string} facilityType - Facility type string
 * @returns {Array} Array of recommended hierarchy level objects
 */
export const getRecommendedHierarchy = (standardId, facilityType) => {
  const config = STANDARDS[standardId] || STANDARDS.ANSI_BHMA;
  const recommendation = config.recommendations[facilityType];

  if (!recommendation) {
    // Default to Commercial Office if facility type not found
    return config.recommendations['Commercial Office'].levels.map(levelId =>
      config.hierarchyLevels.find(l => l.id === levelId)
    );
  }

  return recommendation.levels.map(levelId =>
    config.hierarchyLevels.find(l => l.id === levelId)
  );
};

/**
 * Validate bitting code against MACS rules
 * @param {string} bitting - Bitting code (e.g., "123456")
 * @param {number} macs - Maximum Adjacent Cut Specification
 * @returns {Object} Validation result {isValid: boolean, errors: Array}
 */
export const validateBitting = (bitting, macs) => {
  const errors = [];
  const digits = bitting.split('').map(Number);

  for (let i = 0; i < digits.length - 1; i++) {
    const diff = Math.abs(digits[i] - digits[i + 1]);
    if (diff > macs) {
      errors.push({
        position: i,
        message: `Adjacent cut difference ${diff} exceeds MACS ${macs} at positions ${i + 1}-${i + 2}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get security grade description
 * @param {string} standardId - 'ANSI_BHMA' or 'EN'
 * @param {string} grade - Security grade/class
 * @returns {string} Grade description
 */
export const getSecurityGradeDescription = (standardId, grade) => {
  if (standardId === 'ANSI_BHMA') {
    const descriptions = {
      'Grade 1': 'Heavy-duty commercial (highest security)',
      'Grade 2': 'Standard commercial (medium security)',
      'Grade 3': 'Light commercial/residential (basic security)'
    };
    return descriptions[grade] || grade;
  } else {
    const descriptions = {
      'Class 1': 'Very low security',
      'Class 2': 'Low security',
      'Class 3': 'Medium security',
      'Class 4': 'High security',
      'Class 5': 'Very high security',
      'Class 6': 'Maximum security'
    };
    return descriptions[grade] || grade;
  }
};

export default {
  STANDARDS,
  getStandardConfig,
  calculateMaxDiffers,
  generateKeySymbol,
  getRecommendedHierarchy,
  validateBitting,
  getSecurityGradeDescription
};
