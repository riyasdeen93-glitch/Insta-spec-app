import { describe, it, expect } from "vitest";
import dataset from "./golden_doors.json" assert { type: "json" };
import {
  sanitizeHardwareItems,
  computeSetContext,
  generateInstantDoorSchedule,
  classifyDoor,
  buildSetProfile,
  getAllowedLockTypesForMaterials,
  getAllowedElectrifiedTypesForMaterials,
  getRecommendedHardwareIntent
} from "../../src/App.jsx";
import { evaluateSetValidationIssues } from "../../src/standards/validation.js";

describe("Rule coverage - classification", () => {
  dataset.classificationSamples.forEach((sample) => {
    it(`classifies ${sample.id}`, () => {
      const result = classifyDoor(sample.door);
      Object.entries(sample.expected).forEach(([key, value]) => {
        expect(result[key]).toBe(value);
      });
    });
  });
});

describe("Rule coverage - validation checks", () => {
  dataset.validationScenarios.forEach((scenario) => {
    it(`flags issues for ${scenario.id}`, () => {
      const issues = evaluateSetValidationIssues(scenario.project);
      const messages = issues.map((i) => i.msg).sort();
      expect(messages).toEqual(scenario.expectedIssues.slice().sort());
    });
  });
});

describe("Rule coverage - hardware sanitization", () => {
  it("adds maglock support kit and card reader when allowed", () => {
    const scenario = dataset.hardwareSanitizeScenarios.find((s) => s.id === "maglock_supports_added");
    const sanitized = sanitizeHardwareItems(scenario.items, scenario.standard, scenario.context);
    const types = sanitized.map((i) => i.type);
    scenario.expectedTypes.forEach((expectedType) => {
      expect(types).toContain(expectedType);
    });
  });

  it("auto-applies acoustic package for high STC pairs with vision panels", () => {
    const scenario = dataset.hardwareSanitizeScenarios.find((s) => s.id === "acoustic_auto_package");
    const context = computeSetContext(scenario.doors, scenario.items);
    const sanitized = sanitizeHardwareItems(scenario.items, scenario.standard, { ...context, setId: scenario.context?.setId });
    const autoTags = sanitized.map((i) => i.autoTag).filter(Boolean);
    scenario.expectedAutoTags.forEach((tag) => {
      expect(autoTags).toContain(tag);
    });
  });
});

describe("Rule coverage - material and electrified filters", () => {
  it("restricts lock types for glass doors to patch/panic/maglock", () => {
    const types = getAllowedLockTypesForMaterials(["Glass"]);
    expect(types).toEqual(["Patch Lock", "Panic Bar", "Magnetic Lock"]);
  });

  it("limits electrified hardware for timber/glass combinations", () => {
    const timber = getAllowedElectrifiedTypesForMaterials(["Timber"]);
    const glass = getAllowedElectrifiedTypesForMaterials(["Glass"]);
    expect(timber).toContain("Electric Strike");
    expect(glass).not.toContain("Electric Strike");
    expect(glass).toContain("Magnetic Lock");
  });
});

describe("Rule coverage - instant door generator", () => {
  it("creates education schedule with exits and restrooms", () => {
    const project = {
      type: "Education / School",
      standard: "ANSI",
      instantInputs: {
        "Education / School": { floors: 2, classroomsPerFloor: 4, toiletsPerFloor: 1, hasAdminLabs: true }
      }
    };
    const doors = generateInstantDoorSchedule(project, []);
    const uses = doors.map((d) => d.use);
    expect(uses).toContain("Stairwell / Exit");
    expect(uses).toContain("Restroom");
  });
});

describe("Rule coverage - set profiling", () => {
  it("captures ADA and escape requirements into profile", () => {
    const doors = [
      { id: "d1", use: "Corridor / Circulation", material: "Metal", fire: 60, ada: true },
      { id: "d2", use: "Stairwell / Exit", material: "Metal", fire: 0, ada: false }
    ];
    const profile = buildSetProfile(doors);
    expect(profile.isEscapeRoute).toBe(true);
    expect(profile.requiresFailSafe).toBe(true);
    expect(profile.requiresADA).toBe(true);
    expect(getRecommendedHardwareIntent({ use: "Security / Checkpoint" })).toBe("Electromechanical");
  });
});
