/**
 * Simulated ETA engine. Deterministic: the same request always gets the same estimate.
 * Not based on real fleet availability, traffic, or emergency-service operations.
 */
import type { IncidentCategory, Urgency } from "./types";

export const ETA_CONFIG = {
  baseMinutes: 9,
  category: { medical: 0, injury: 2, evacuation: 6, other: 4 } as Record<IncidentCategory, number>,
  urgency: { critical: -3, high: -1, moderate: 2, low: 5 } as Record<Urgency, number>,
  noCoordinatesPenalty: 6,
  maxVariation: 3,
  minMinutes: 4,
};

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface EtaInput {
  id: string;
  category: IncidentCategory;
  urgency: Urgency;
  hasCoordinates: boolean;
}

export interface EtaResult {
  minutes: number;
  fallback: boolean;
  steps: { label: string; delta: number }[];
}

export function estimateEta(input: EtaInput, cfg = ETA_CONFIG): EtaResult {
  const steps: EtaResult["steps"] = [{ label: "Base response time (demo)", delta: cfg.baseMinutes }];
  steps.push({ label: "Incident category adjustment", delta: cfg.category[input.category] ?? 0 });
  steps.push({ label: "Reported urgency adjustment", delta: cfg.urgency[input.urgency] ?? 0 });
  if (!input.hasCoordinates) steps.push({ label: "No coordinates — fallback estimate", delta: cfg.noCoordinatesPenalty });
  steps.push({ label: "Request-specific variation (stable)", delta: hashString(input.id) % cfg.maxVariation });
  const total = steps.reduce((s, x) => s + x.delta, 0);
  return { minutes: Math.max(cfg.minMinutes, total), fallback: !input.hasCoordinates, steps };
}

export const ETA_DISCLAIMER =
  "Estimate generated from demo assumptions; not based on real fleet availability, traffic, or emergency-service operations.";
