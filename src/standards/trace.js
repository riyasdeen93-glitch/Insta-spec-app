const normalizeFlag = (value) => {
  if (typeof value !== "string") return false;
  return value.toLowerCase() === "on" || value.toLowerCase() === "true";
};

const resolveTraceEnabled = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_STANDARDS_TRACE) {
      return normalizeFlag(import.meta.env.VITE_STANDARDS_TRACE);
    }
  } catch (err) {
    // noop: import.meta may not exist in tests
  }
  if (typeof process !== "undefined" && process.env?.STANDARDS_TRACE) {
    return normalizeFlag(process.env.STANDARDS_TRACE);
  }
  if (typeof window !== "undefined" && window.STANDARDS_TRACE) {
    return normalizeFlag(window.STANDARDS_TRACE);
  }
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("STANDARDS_TRACE");
    if (stored) return normalizeFlag(stored);
  }
  return false;
};

export const STANDARDS_TRACE_ENABLED = resolveTraceEnabled();

const traceBuffer = [];

const recordTrace = (entry) => {
  if (!STANDARDS_TRACE_ENABLED) return;
  traceBuffer.push(entry);
  if (typeof console !== "undefined" && console.debug) {
    console.debug("[STANDARDS_TRACE]", entry);
  }
};

export const traceRuleEvent = (subjectId, stage, detail = {}) => {
  recordTrace({
    subject: subjectId || "unknown",
    stage,
    detail,
    at: new Date().toISOString()
  });
};

export const traceSetEvent = (setId, stage, detail = {}) => {
  traceRuleEvent(setId || "set-unknown", stage, detail);
};

export const getTraceBuffer = () => traceBuffer.slice();

export const resetTraceBuffer = () => {
  traceBuffer.length = 0;
};
