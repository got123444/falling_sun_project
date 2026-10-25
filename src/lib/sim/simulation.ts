import { EDGES, SEED, getNode, makePatient, mulberry32 } from "./data";
import { shortestPath, type RouteResult } from "./routing";
import { assessPriority } from "./triage";
import type { Facility, Hazard, LogEntry, Patient, World } from "./types";

export const MAX_PATIENTS = 34;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function addLog(w: World, kind: LogEntry["kind"], text: string): World {
  const entry = { id: w.nextLogId, minute: w.minute, kind, text };
  return { ...w, log: [entry, ...w.log].slice(0, 200), nextLogId: w.nextLogId + 1 };
}

export function routeFor(p: Patient, f: Facility, hazards: Hazard[], speedKmh: number): RouteResult | null {
  return shortestPath(EDGES, p.node, f.node, { hazards, speedKmh });
}

export interface Suggestion {
  facility: Facility;
  route: RouteResult;
}

/** Fastest reachable facility with a free bed. */
export function suggestFacility(p: Patient, facilities: Facility[], hazards: Hazard[], speedKmh: number): Suggestion | null {
  let best: Suggestion | null = null;
  for (const f of facilities) {
    if (f.capacity - f.occupied <= 0) continue;
    const route = routeFor(p, f, hazards, speedKmh);
    if (route && (!best || route.minutes < best.route.minutes)) best = { facility: f, route };
  }
  return best;
}

function drift(p: Patient, rng: () => number, worsen: boolean): Patient {
  const v = p.vitals;
  const bias = worsen ? 1 : 0.5;
  const step = (x: number | null, spread: number, dir: number, lo: number, hi: number) =>
    x === null ? null : Math.round(clamp(x + (rng() - bias) * spread * dir, lo, hi));
  return {
    ...p,
    vitals: {
      hr: step(v.hr, worsen ? 30 : 10, -1, 30, 190),
      spo2: step(v.spo2, worsen ? 8 : 3, 1, 70, 100),
      rr: step(v.rr, worsen ? 10 : 4, -1, 6, 45),
      sbp: step(v.sbp, worsen ? 25 : 10, 1, 60, 190),
    },
  };
}

export function changeVitals(w: World, patientId: string, worsen: boolean, seedOffset = 0): World {
  const rng = mulberry32(SEED + w.tick * 31 + seedOffset);
  const idx = w.patients.findIndex((p) => p.id === patientId);
  if (idx < 0) return w;
  const before = assessPriority(w.patients[idx].vitals).category;
  const next = drift(w.patients[idx], rng, worsen);
  const after = assessPriority(next.vitals).category;
  const patients = w.patients.slice();
  patients[idx] = next;
  let out: World = { ...w, patients };
  if (before !== after) out = addLog(out, "vitals", `${patientId} moved from ${before} to ${after}`);
  else if (worsen) out = addLog(out, "vitals", `${patientId} observations changed (manual trigger)`);
  return out;
}

export function tickWorld(w: World): World {
  let out: World = { ...w, tick: w.tick + 1, minute: w.minute + 1 };
  const rng = mulberry32(SEED + out.tick * 97);

  // One patient's observations drift per tick — the rest stay stable.
  const candidates = out.patients.filter((p) => p.status !== "evacuated");
  if (candidates.length) {
    const p = candidates[(out.tick * 7) % candidates.length];
    out = changeVitals(out, p.id, rng() > 0.8, 1);
  }

  // New fictional case every 8 sim minutes.
  if (out.tick % 8 === 0 && out.patients.length < MAX_PATIENTS) {
    const p = makePatient(out.patients.length, rng, out.minute);
    out = addLog({ ...out, patients: [...out.patients, p] }, "arrival", `New case ${p.id} reported near ${getNode(p.node).label}`);
  }

  // Arrivals at facilities.
  for (const p of out.patients) {
    if (p.status === "in_transit" && p.arriveAt !== null && p.arriveAt <= out.minute) {
      out = {
        ...out,
        patients: out.patients.map((x) => (x.id === p.id ? { ...x, status: "evacuated" as const } : x)),
      };
      const f = out.facilities.find((f) => f.id === p.facilityId);
      out = addLog(out, "status", `${p.id} arrived at ${f?.name ?? "facility"}`);
    }
  }
  return out;
}

export type AssignResult = { ok: true; world: World } | { ok: false; reason: string };

export function assignFacility(w: World, patientId: string, facilityId: string, override: boolean): AssignResult {
  const p = w.patients.find((x) => x.id === patientId);
  const f = w.facilities.find((x) => x.id === facilityId);
  if (!p || !f) return { ok: false, reason: "Unknown patient or facility" };
  if (p.facilityId === facilityId) return { ok: true, world: w };
  if (f.capacity - f.occupied <= 0 && !override) return { ok: false, reason: `${f.name} has no free beds` };
  const facilities = w.facilities.map((x) =>
    x.id === facilityId ? { ...x, occupied: x.occupied + 1 } : x.id === p.facilityId ? { ...x, occupied: Math.max(0, x.occupied - 1) } : x,
  );
  const patients = w.patients.map((x) => (x.id === patientId ? { ...x, facilityId, override: f.capacity - f.occupied <= 0 } : x));
  return { ok: true, world: addLog({ ...w, facilities, patients }, "status", `${patientId} assigned to ${f.name}${override && f.capacity - f.occupied <= 0 ? " (capacity override)" : ""}`) };
}

export function setPatientStatus(w: World, patientId: string, status: Patient["status"], speedKmh: number): AssignResult {
  const p = w.patients.find((x) => x.id === patientId);
  if (!p) return { ok: false, reason: "Unknown patient" };
  let world = w;
  if (status === "in_transit") {
    if (!p.facilityId) {
      const s = suggestFacility(p, w.facilities, w.hazards, speedKmh);
      if (!s) return { ok: false, reason: "No reachable facility with free beds" };
      const r = assignFacility(w, p.id, s.facility.id, false);
      if (!r.ok) return r;
      world = r.world;
    }
    const cur = world.patients.find((x) => x.id === patientId)!;
    const f = world.facilities.find((x) => x.id === cur.facilityId)!;
    const route = routeFor(cur, f, world.hazards, speedKmh);
    if (!route) return { ok: false, reason: `No open route to ${f.name}` };
    world = {
      ...world,
      patients: world.patients.map((x) => (x.id === patientId ? { ...x, status, arriveAt: world.minute + Math.max(1, route.minutes) } : x)),
    };
    return { ok: true, world: addLog(world, "status", `${patientId} in transit to ${f.name}, ~${route.minutes} sim min`) };
  }
  world = {
    ...world,
    patients: world.patients.map((x) => (x.id === patientId ? { ...x, status, arriveAt: status === "awaiting" ? null : x.arriveAt } : x)),
  };
  const label = status === "evacuated" ? "marked evacuated" : "returned to awaiting transport";
  return { ok: true, world: addLog(world, "status", `${patientId} ${label}`) };
}

export function formatSimTime(minute: number): string {
  const sign = minute < 0 ? "-" : "+";
  const m = Math.abs(minute);
  return `T${sign}${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
