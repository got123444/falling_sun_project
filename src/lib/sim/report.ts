import { getNode } from "./data";
import { routeFor } from "./simulation";
import { assessPriority } from "./triage";
import type { World } from "./types";

export function patientRows(w: World, speedKmh: number) {
  return w.patients.map((p) => {
    const t = assessPriority(p.vitals);
    const f = w.facilities.find((x) => x.id === p.facilityId);
    const r = f ? routeFor(p, f, w.hazards, speedKmh) : null;
    return { id: p.id, location: getNode(p.node).label, ...p.vitals, priority: t.category, reason: t.summary, facility: f?.name ?? "", eta: r?.minutes ?? null, status: p.status, arrivedAt: p.arrivedAt };
  });
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return ["# SIMULATED DATA - NOT FOR CLINICAL USE", keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
