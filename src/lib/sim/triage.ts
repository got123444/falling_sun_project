/**
 * DEMONSTRATION triage rules. Not clinically validated.
 * Each rule adds points; the total maps to a demo category.
 */
import type { Vitals } from "./types";

export type TriageCategory = "urgent" | "monitor" | "routine";

export interface Thresholds {
  spo2Critical: number;
  spo2Low: number;
  hrCriticalHigh: number;
  hrHigh: number;
  hrCriticalLow: number;
  hrLow: number;
  rrCritical: number;
  rrHigh: number;
  sbpCritical: number;
  sbpLow: number;
  urgentScore: number;
  monitorScore: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  spo2Critical: 90,
  spo2Low: 94,
  hrCriticalHigh: 130,
  hrHigh: 110,
  hrCriticalLow: 40,
  hrLow: 50,
  rrCritical: 30,
  rrHigh: 22,
  sbpCritical: 90,
  sbpLow: 100,
  urgentScore: 4,
  monitorScore: 2,
};

export interface Contribution {
  rule: string;
  points: number;
  detail: string;
}

export interface TriageResult {
  category: TriageCategory;
  score: number;
  contributions: Contribution[];
  summary: string;
  hasMissing: boolean;
}

const PLAUSIBLE = {
  hr: [20, 250],
  spo2: [50, 100],
  rr: [4, 60],
  sbp: [40, 260],
} as const;

const NAMES = { hr: "Heart rate", spo2: "Oxygen saturation", rr: "Respiratory rate", sbp: "Systolic BP" };

function read(v: Vitals, k: keyof Vitals): number | null {
  const val = v[k];
  if (typeof val !== "number" || !Number.isFinite(val)) return null;
  const [min, max] = PLAUSIBLE[k];
  return val >= min && val <= max ? val : null;
}

export function assessPriority(vitals: Vitals, t: Thresholds = DEFAULT_THRESHOLDS): TriageResult {
  const c: Contribution[] = [];
  const missing: string[] = [];

  const spo2 = read(vitals, "spo2");
  if (spo2 === null) missing.push("spo2");
  else if (spo2 < t.spo2Critical) c.push({ rule: "SpO₂ critical", points: 3, detail: `Oxygen saturation ${spo2}% is below ${t.spo2Critical}%` });
  else if (spo2 < t.spo2Low) c.push({ rule: "SpO₂ low", points: 1, detail: `Oxygen saturation ${spo2}% is below ${t.spo2Low}%` });

  const hr = read(vitals, "hr");
  if (hr === null) missing.push("hr");
  else if (hr >= t.hrCriticalHigh || hr <= t.hrCriticalLow) c.push({ rule: "Heart rate extreme", points: 2, detail: `Heart rate ${hr} bpm is outside ${t.hrCriticalLow}–${t.hrCriticalHigh}` });
  else if (hr > t.hrHigh || hr < t.hrLow) c.push({ rule: "Heart rate abnormal", points: 1, detail: `Heart rate ${hr} bpm is outside ${t.hrLow}–${t.hrHigh}` });

  const rr = read(vitals, "rr");
  if (rr === null) missing.push("rr");
  else if (rr >= t.rrCritical) c.push({ rule: "Breathing very fast", points: 2, detail: `Respiratory rate ${rr}/min is at or above ${t.rrCritical}` });
  else if (rr > t.rrHigh) c.push({ rule: "Breathing fast", points: 1, detail: `Respiratory rate ${rr}/min is above ${t.rrHigh}` });

  const sbp = read(vitals, "sbp");
  if (sbp === null) missing.push("sbp");
  else if (sbp < t.sbpCritical) c.push({ rule: "Blood pressure critical", points: 3, detail: `Systolic BP ${sbp} mmHg is below ${t.sbpCritical}` });
  else if (sbp < t.sbpLow) c.push({ rule: "Blood pressure low", points: 1, detail: `Systolic BP ${sbp} mmHg is below ${t.sbpLow}` });

  for (const m of missing) {
    c.push({ rule: "Missing observation", points: 1, detail: `${NAMES[m as keyof Vitals]} missing or implausible — check manually` });
  }

  const score = c.reduce((s, x) => s + x.points, 0);
  let category: TriageCategory = score >= t.urgentScore ? "urgent" : score >= t.monitorScore ? "monitor" : "routine";
  if (missing.length > 0 && category === "routine") category = "monitor";

  const top = [...c].sort((a, b) => b.points - a.points)[0];
  return {
    category,
    score,
    contributions: c,
    summary: top ? top.detail : "All observations within demo ranges",
    hasMissing: missing.length > 0,
  };
}

export const CATEGORY_META: Record<TriageCategory, { label: string; rank: number }> = {
  urgent: { label: "Urgent review", rank: 0 },
  monitor: { label: "Monitor", rank: 1 },
  routine: { label: "Routine", rank: 2 },
};
