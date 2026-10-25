/** Approximate Delhi-area map anchors for a fictional training simulation. */
import type { Edge, Facility, Hazard, MapNode, Patient, Vitals, World } from "./types";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED = 4242;

export const NODES: MapNode[] = [
  { id: "N1", label: "Rohini", x: 380, y: 150 },
  { id: "N2", label: "Kashmere Gate ISBT", x: 570, y: 235 },
  { id: "N3", label: "Connaught Place", x: 515, y: 310 },
  { id: "N4", label: "Shahdara Bus Terminal", x: 710, y: 265 },
  { id: "N5", label: "Dwarka Sec 21", x: 200, y: 430 },
  { id: "N6", label: "New Delhi Railway Station", x: 540, y: 345 },
  { id: "N7", label: "ITO", x: 610, y: 365 },
  { id: "N8", label: "Akshardham", x: 715, y: 410 },
  { id: "N9", label: "Noida Sec 18", x: 850, y: 465 },
  { id: "N10", label: "IGI Airport", x: 330, y: 515 },
  { id: "N11", label: "AIIMS", x: 535, y: 450 },
  { id: "N12", label: "India Gate", x: 590, y: 395 },
  { id: "N13", label: "Gurugram", x: 475, y: 570 },
];

const nodeById = new Map(NODES.map((n) => [n.id, n]));
export const getNode = (id: string) => nodeById.get(id)!;

const PAIRS: [string, string][] = [
  ["N1", "N2"], ["N2", "N3"], ["N3", "N4"], ["N1", "N5"], ["N2", "N6"], ["N3", "N7"], ["N4", "N8"],
  ["N5", "N6"], ["N6", "N7"], ["N7", "N8"], ["N8", "N9"], ["N4", "N9"], ["N5", "N10"], ["N6", "N11"],
  ["N7", "N11"], ["N7", "N12"], ["N8", "N12"], ["N9", "N13"], ["N10", "N11"], ["N11", "N12"], ["N12", "N13"], ["N3", "N6"],
];

export const EDGES: Edge[] = PAIRS.map(([a, b]) => {
  const A = getNode(a), B = getNode(b);
  return [a, b, Math.round((Math.hypot(A.x - B.x, A.y - B.y) / 70) * 10) / 10];
});

export function initialFacilities(): Facility[] {
  return [
    { id: "F1", name: "Kestrel General", node: "N6", capacity: 14, occupied: 4 },
    { id: "F2", name: "Ridge Field Hospital", node: "N3", capacity: 8, occupied: 3 },
    { id: "F3", name: "Harbor Trauma Unit", node: "N13", capacity: 12, occupied: 2 },
    { id: "F4", name: "Marsh Lane Clinic", node: "N10", capacity: 5, occupied: 2 },
  ];
}

export function initialHazards(): Hazard[] {
  return [
    { id: "H1", label: "Flooded crossing", edge: ["N7", "N12"], severity: "blocked", active: true },
    { id: "H2", label: "Debris on road", edge: ["N2", "N3"], severity: "slow", active: true },
    { id: "H3", label: "Grass fire", edge: ["N8", "N9"], severity: "blocked", active: true },
    { id: "H4", label: "Bridge inspection", edge: ["N5", "N6"], severity: "slow", active: false },
  ];
}

const PATIENT_NODES = ["N1", "N2", "N4", "N5", "N7", "N8", "N9", "N11", "N12"];

export function makePatient(index: number, rng: () => number, minute: number): Patient {
  const node = PATIENT_NODES[Math.floor(rng() * PATIENT_NODES.length)];
  const n = getNode(node);
  const sick = rng();
  const vitals: Vitals = {
    hr: Math.round(sick > 0.75 ? 120 + rng() * 25 : 68 + rng() * 40),
    spo2: Math.round(sick > 0.8 ? 84 + rng() * 6 : 93 + rng() * 6),
    rr: Math.round(sick > 0.7 ? 24 + rng() * 9 : 12 + rng() * 9),
    sbp: Math.round(sick > 0.85 ? 78 + rng() * 15 : 102 + rng() * 30),
  };
  if (index === 4) vitals.spo2 = null; // demonstrates missing observation handling
  return {
    id: `P-${String(101 + index)}`,
    node,
    x: n.x + Math.round((rng() - 0.5) * 60),
    y: n.y + Math.round((rng() - 0.5) * 50),
    vitals,
    status: "awaiting",
    facilityId: null,
    arrivedAt: minute,
    arriveAt: null,
    override: false,
  };
}

export function createInitialWorld(): World {
  const rng = mulberry32(SEED);
  const patients: Patient[] = [];
  for (let i = 0; i < 22; i++) patients.push(makePatient(i, rng, -Math.floor((22 - i) * 2.5)));
  // A few cases already evacuated to show history.
  const facilities = initialFacilities();
  [1, 6, 13].forEach((i, k) => {
    patients[i].status = "evacuated";
    patients[i].facilityId = facilities[k].id;
    facilities[k].occupied += 1;
  });
  return {
    tick: 0,
    minute: 0,
    patients,
    facilities,
    hazards: initialHazards(),
    log: [{ id: 1, minute: 0, kind: "system", text: "Simulation started with 22 fictional patients on the Delhi reference map" }],
    nextLogId: 2,
  };
}
