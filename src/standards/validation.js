import { traceSetEvent } from "./trace";

export const evaluateSetValidationIssues = (project, tracer = traceSetEvent) => {
  if (!project) return [];
  const issues = [];
  const doors = project.doors || [];

  (project.sets || []).forEach((set) => {
    const doorsInSet = doors.filter((d) => (set.doors || []).includes(d.id));
    const isFireRated = doorsInSet.some((d) => d.fire > 0);
    const isStair = doorsInSet.some(
      (d) => (d.use || "").toLowerCase().includes("stair") || (d.use || "").toLowerCase().includes("exit")
    );
    const isGlass = doorsInSet.some((d) => d.material === "Glass");

    if (isFireRated) {
      const hasCloser = (set.items || []).some((i) => i.category === "Closers");
      if (!hasCloser) {
        const msg = `Fire Rated set ${set.id} is missing a Door Closer.`;
        issues.push({ set: set.id, type: "critical", msg });
        tracer(set.id, "validation", { rule: "fire-door-closer", msg });
      }
      const hasSeal = (set.items || []).some((i) => i.category === "Seals");
      if (!hasSeal) {
        const msg = `Fire Rated set ${set.id} requires perimeter/drop seals.`;
        issues.push({ set: set.id, type: "critical", msg });
        tracer(set.id, "validation", { rule: "fire-door-seal", msg });
      }
    }

    if (isStair) {
      const hasPanic = (set.items || []).some((i) => (i.type || "").toLowerCase().includes("panic"));
      if (!hasPanic) {
        const msg = `Stair/Exit set ${set.id} is missing Panic Hardware.`;
        issues.push({ set: set.id, type: "critical", msg });
        tracer(set.id, "validation", { rule: "egress-panic", msg });
      }
    }

    if (isGlass) {
      const hasPatch = (set.items || []).some((i) => (i.type || "").toLowerCase().includes("patch") || (i.type || "").toLowerCase().includes("rail"));
      if (!hasPatch) {
        const msg = `Glass door set ${set.id} might need Patch Fittings or Rails.`;
        issues.push({ set: set.id, type: "warning", msg });
        tracer(set.id, "validation", { rule: "glass-support", msg });
      }
    }
  });

  return issues;
};
