/**
 * Standards Validation Utility
 *
 * Comprehensive validation for EN 1303 and ANSI/BHMA A156.28 standards
 */

/**
 * Validate EN 1303 key symbol format
 */
export const validateEN1303KeySymbol = (keySymbol, hierarchyLevel) => {
  const errors = [];
  const warnings = [];

  // GMK (General Master Key) - Level 0
  if (hierarchyLevel === 0) {
    if (keySymbol !== 'GMK') {
      errors.push({
        type: 'invalid_gmk_symbol',
        message: 'EN 1303 requires General Master Key to use symbol "GMK"',
        expected: 'GMK',
        actual: keySymbol
      });
    }
  }

  // MK-X (Master Keys) - Level 1
  else if (hierarchyLevel === 1) {
    const mkPattern = /^MK-\d+$/;
    if (!mkPattern.test(keySymbol)) {
      errors.push({
        type: 'invalid_mk_format',
        message: 'EN 1303 Master Key must follow format "MK-X" (e.g., MK-1, MK-2)',
        expected: 'MK-[number]',
        actual: keySymbol
      });
    }
  }

  // SK-X (Sub-Keys) - Level 2
  else if (hierarchyLevel === 2) {
    const skPattern = /^SK-\d+$/;
    if (!skPattern.test(keySymbol)) {
      errors.push({
        type: 'invalid_sk_format',
        message: 'EN 1303 Sub-Key must follow format "SK-X" (e.g., SK-1, SK-2)',
        expected: 'SK-[number]',
        actual: keySymbol
      });
    }
  }

  // CK-XXX (Change/User Keys) - Level 3+
  else {
    const ckPattern = /^CK-\d{3,}$/;
    if (!ckPattern.test(keySymbol)) {
      errors.push({
        type: 'invalid_ck_format',
        message: 'EN 1303 Change Key must follow format "CK-XXX" (e.g., CK-101, CK-201)',
        expected: 'CK-[3+ digits]',
        actual: keySymbol
      });
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

/**
 * Validate ANSI/BHMA key symbol format
 */
export const validateANSIKeySymbol = (keySymbol, hierarchyLevel) => {
  const errors = [];
  const warnings = [];

  // Restricted letters per ANSI/BHMA A156.28
  const restrictedLetters = ['I', 'O', 'Q', 'X'];

  // Check for restricted letters
  for (const letter of restrictedLetters) {
    if (keySymbol.includes(letter)) {
      errors.push({
        type: 'restricted_letter',
        message: `ANSI/BHMA prohibits using letters ${restrictedLetters.join(', ')} in key symbols`,
        letter: letter,
        symbol: keySymbol
      });
    }
  }

  // Great Grand Master or Grand Master (Level 0)
  if (hierarchyLevel === 0) {
    if (keySymbol.length !== 1 || !/^[A-Z]$/.test(keySymbol)) {
      errors.push({
        type: 'invalid_top_level_format',
        message: 'ANSI/BHMA top-level master must be single letter (e.g., A)',
        expected: 'Single letter A-Z',
        actual: keySymbol
      });
    }
  }

  // Grand Master or Master Keys (Level 1)
  else if (hierarchyLevel === 1) {
    if (keySymbol.length !== 2 || !/^[A-Z]{2}$/.test(keySymbol)) {
      errors.push({
        type: 'invalid_level1_format',
        message: 'ANSI/BHMA Level 1 master must be two letters (e.g., AA, AB)',
        expected: 'Two letters',
        actual: keySymbol
      });
    }

    // Check for proper pairing (AA, AB, AC - not AZ, AY)
    if (keySymbol.length === 2) {
      const firstLetter = keySymbol[0];
      const secondLetter = keySymbol[1];

      // Second letter should typically follow sequence A, B, C, D...
      // Warn if using letters far apart
      const firstCode = firstLetter.charCodeAt(0);
      const secondCode = secondLetter.charCodeAt(0);
      const diff = Math.abs(secondCode - firstCode);

      if (diff > 10) {
        warnings.push({
          type: 'unusual_pairing',
          message: `Unusual letter pairing "${keySymbol}". Standard practice uses consecutive letters (AA, AB, AC)`,
          symbol: keySymbol
        });
      }
    }
  }

  // Master or Sub-Master Keys (Level 2)
  else if (hierarchyLevel === 2) {
    if (keySymbol.length !== 3 || !/^[A-Z]{3}$/.test(keySymbol)) {
      errors.push({
        type: 'invalid_level2_format',
        message: 'ANSI/BHMA Level 2 keys must be three letters (e.g., AAA, AAB)',
        expected: 'Three letters',
        actual: keySymbol
      });
    }
  }

  // Change Keys (Level 3+)
  else {
    // Change keys follow pattern: AAA1, AAA2, AB1, AB2
    const ckPattern = /^[A-Z]{2,3}\d+$/;
    if (!ckPattern.test(keySymbol)) {
      errors.push({
        type: 'invalid_change_key_format',
        message: 'ANSI/BHMA Change Key must be letters followed by numbers (e.g., AA1, AAA1)',
        expected: '[Letters][Numbers]',
        actual: keySymbol
      });
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

/**
 * Validate key symbol sequence
 */
export const validateKeySequence = (keys, standard) => {
  const errors = [];
  const warnings = [];

  if (standard === 'EN') {
    // Check MK sequence (MK-1, MK-2, MK-3...)
    const masterKeys = keys.filter(k => k.keySymbol.startsWith('MK-')).sort((a, b) => {
      const aNum = parseInt(a.keySymbol.split('-')[1]);
      const bNum = parseInt(b.keySymbol.split('-')[1]);
      return aNum - bNum;
    });

    for (let i = 0; i < masterKeys.length; i++) {
      const expectedNum = i + 1;
      const actualNum = parseInt(masterKeys[i].keySymbol.split('-')[1]);

      if (actualNum !== expectedNum) {
        warnings.push({
          type: 'sequence_gap',
          message: `EN 1303 recommends sequential numbering. Expected MK-${expectedNum}, found ${masterKeys[i].keySymbol}`,
          expected: `MK-${expectedNum}`,
          actual: masterKeys[i].keySymbol
        });
      }
    }

    // Check CK sequence within each master
    const changeKeys = keys.filter(k => k.keySymbol.startsWith('CK-'));
    const ckByMaster = {};

    changeKeys.forEach(ck => {
      const masterNum = ck.keySymbol.substring(3, 4); // CK-101 → 1
      if (!ckByMaster[masterNum]) ckByMaster[masterNum] = [];
      ckByMaster[masterNum].push(ck);
    });

    Object.entries(ckByMaster).forEach(([masterNum, cks]) => {
      const sorted = cks.sort((a, b) => {
        const aNum = parseInt(a.keySymbol.split('-')[1]);
        const bNum = parseInt(b.keySymbol.split('-')[1]);
        return aNum - bNum;
      });

      // Check for gaps
      const expectedStart = parseInt(masterNum) * 100 + 1;
      for (let i = 0; i < sorted.length; i++) {
        const expectedNum = expectedStart + i;
        const actualNum = parseInt(sorted[i].keySymbol.split('-')[1]);

        if (actualNum !== expectedNum) {
          warnings.push({
            type: 'change_key_gap',
            message: `Change key numbering gap detected. Expected CK-${String(expectedNum).padStart(3, '0')}, found ${sorted[i].keySymbol}`,
            master: `MK-${masterNum}`
          });
        }
      }
    });
  }

  else if (standard === 'ANSI_BHMA') {
    // Check letter sequence (AA, AB, AC not AA, AC, AB)
    const level1Keys = keys.filter(k => k.hierarchyLevel === 1 && /^[A-Z]{2}$/.test(k.keySymbol));
    const sorted = level1Keys.sort((a, b) => a.keySymbol.localeCompare(b.keySymbol));

    for (let i = 1; i < sorted.length; i++) {
      const prevSecondLetter = sorted[i - 1].keySymbol[1];
      const currSecondLetter = sorted[i].keySymbol[1];

      const expectedNext = String.fromCharCode(prevSecondLetter.charCodeAt(0) + 1);

      if (currSecondLetter !== expectedNext) {
        warnings.push({
          type: 'letter_sequence_gap',
          message: `ANSI/BHMA recommends consecutive letters. After ${sorted[i - 1].keySymbol}, expected ${sorted[i - 1].keySymbol[0]}${expectedNext}, found ${sorted[i].keySymbol}`,
          expected: `${sorted[i - 1].keySymbol[0]}${expectedNext}`,
          actual: sorted[i].keySymbol
        });
      }
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

/**
 * Validate hierarchy depth limits
 */
export const validateHierarchyDepth = (hierarchyCount, standard, facilityType) => {
  const errors = [];
  const warnings = [];

  if (standard === 'EN') {
    // EN 1303 typically allows:
    // - 2 levels: GM → UK (simple)
    // - 3 levels: GM → MK → UK (standard)
    // - 4 levels: GGM → GM → MK → UK (complex)

    if (hierarchyCount > 4) {
      warnings.push({
        type: 'excessive_depth',
        message: 'EN 1303 typically uses 2-4 hierarchy levels. More than 4 levels may complicate system management',
        current: hierarchyCount,
        recommended: '2-4 levels'
      });
    }

    if (hierarchyCount < 2) {
      errors.push({
        type: 'insufficient_depth',
        message: 'EN 1303 requires at least 2 hierarchy levels (Master and User keys)',
        current: hierarchyCount,
        minimum: 2
      });
    }
  }

  else if (standard === 'ANSI_BHMA') {
    // ANSI/BHMA A156.28 allows:
    // - 2 levels: GM → CK
    // - 3 levels: GGM → GM → CK (most common)
    // - 4 levels: GGGM → GGM → GM → CK
    // - 5 levels: Maximum practical depth

    if (hierarchyCount > 5) {
      errors.push({
        type: 'exceeds_maximum_depth',
        message: 'ANSI/BHMA practical limit is 5 hierarchy levels',
        current: hierarchyCount,
        maximum: 5
      });
    }

    if (hierarchyCount < 2) {
      errors.push({
        type: 'insufficient_depth',
        message: 'ANSI/BHMA requires at least 2 hierarchy levels',
        current: hierarchyCount,
        minimum: 2
      });
    }
  }

  // Facility-specific recommendations
  const facilityRecommendations = {
    'Commercial Office': { min: 2, max: 3, optimal: 3 },
    'Hospital / Healthcare': { min: 3, max: 4, optimal: 4 },
    'Education / School': { min: 2, max: 3, optimal: 3 },
    'Airport / Transport': { min: 3, max: 4, optimal: 4 },
    'Hospitality / Hotel': { min: 3, max: 4, optimal: 4 },
    'Residential': { min: 2, max: 2, optimal: 2 }
  };

  const recommendation = facilityRecommendations[facilityType];
  if (recommendation) {
    if (hierarchyCount < recommendation.min) {
      warnings.push({
        type: 'below_facility_minimum',
        message: `${facilityType} facilities typically require at least ${recommendation.min} levels`,
        facility: facilityType,
        current: hierarchyCount,
        recommended: recommendation.optimal
      });
    }

    if (hierarchyCount > recommendation.max) {
      warnings.push({
        type: 'above_facility_maximum',
        message: `${facilityType} facilities rarely need more than ${recommendation.max} levels`,
        facility: facilityType,
        current: hierarchyCount,
        recommended: recommendation.optimal
      });
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

/**
 * Validate master key pairing rules (ANSI specific)
 */
export const validateMasterKeyPairing = (hierarchies, standard) => {
  const errors = [];
  const warnings = [];

  if (standard !== 'ANSI_BHMA') {
    return { errors, warnings, isValid: true };
  }

  // Check that children follow parent naming
  hierarchies.forEach(hierarchy => {
    if (hierarchy.parentHierarchyId) {
      const parent = hierarchies.find(h => h.hierarchyId === hierarchy.parentHierarchyId);

      if (parent) {
        // Child should start with parent symbol
        if (!hierarchy.keySymbol.startsWith(parent.keySymbol)) {
          errors.push({
            type: 'invalid_parent_child_pairing',
            message: `ANSI/BHMA requires child keys to start with parent symbol`,
            parent: parent.keySymbol,
            child: hierarchy.keySymbol,
            expected: `${parent.keySymbol}[letter/number]`
          });
        }
      }
    }
  });

  return { errors, warnings, isValid: errors.length === 0 };
};

/**
 * Comprehensive standards validation
 */
export const validateStandardsCompliance = (hierarchies, assignments, standard, facilityType) => {
  const allErrors = [];
  const allWarnings = [];

  // Collect all keys
  const allKeys = [
    ...hierarchies.map(h => ({
      keySymbol: h.keySymbol,
      hierarchyLevel: h.order,
      levelType: h.levelType
    })),
    ...assignments.map(a => ({
      keySymbol: a.keySymbol,
      hierarchyLevel: 3, // Change keys are typically level 3+
      levelType: 'CK'
    }))
  ];

  // Validate each key symbol format
  allKeys.forEach(key => {
    let validation;

    if (standard === 'EN') {
      validation = validateEN1303KeySymbol(key.keySymbol, key.hierarchyLevel);
    } else {
      validation = validateANSIKeySymbol(key.keySymbol, key.hierarchyLevel);
    }

    allErrors.push(...validation.errors);
    allWarnings.push(...validation.warnings);
  });

  // Validate key sequence
  const sequenceValidation = validateKeySequence(allKeys, standard);
  allErrors.push(...sequenceValidation.errors);
  allWarnings.push(...sequenceValidation.warnings);

  // Validate hierarchy depth
  const depthValidation = validateHierarchyDepth(hierarchies.length, standard, facilityType);
  allErrors.push(...depthValidation.errors);
  allWarnings.push(...depthValidation.warnings);

  // Validate master key pairing (ANSI only)
  if (standard === 'ANSI_BHMA') {
    const pairingValidation = validateMasterKeyPairing(hierarchies, standard);
    allErrors.push(...pairingValidation.errors);
    allWarnings.push(...pairingValidation.warnings);
  }

  return {
    errors: allErrors,
    warnings: allWarnings,
    isValid: allErrors.length === 0
  };
};
