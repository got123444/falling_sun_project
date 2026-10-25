export interface Vitals {
  hr: number | null; // heart rate, bpm
  spo2: number | null; // oxygen saturation, %
  rr: number | null; // respiratory rate, /min
  sbp: number | null; // systolic blood pressure, mmHg
}

export type PatientStatus = "awaiting" | "in_transit" | "evacuated";

export interface Patient {
  id: string;
  node: string;
  x: number;
  y: number;
  vitals: Vitals;
  status: PatientStatus;
  facilityId: string | null;
  arrivedAt: number; // sim minute the case was reported
  arriveAt: number | null; // sim minute expected at facility
  override: boolean;
}

export interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export type Edge = [string, string, number]; // a, b, km

export interface Facility {
  id: string;
  name: string;
  node: string;
  capacity: number;
  occupied: number;
}

export interface Hazard {
  id: string;
  label: string;
  edge: [string, string];
  severity: "blocked" | "slow";
  active: boolean;
}

export interface LogEntry {
  id: number;
  minute: number;
  kind: "vitals" | "status" | "arrival" | "system" | "request";
  text: string;
}

export interface World {
  tick: number;
  minute: number;
  patients: Patient[];
  facilities: Facility[];
  hazards: Hazard[];
  log: LogEntry[];
  nextLogId: number;
}

export type IncidentCategory = "medical" | "injury" | "evacuation" | "other";
export type Urgency = "critical" | "high" | "moderate" | "low";
export type RequestStatus = "created" | "awaiting" | "assigned" | "completed";

export interface RequestLocation {
  kind: "gps" | "manual" | "none";
  lat?: number;
  lng?: number;
  accuracy?: number;
  text?: string;
}

export interface DemoRequest {
  id: string;
  mode: "detailed" | "quick";
  createdAt: string;
  name?: string;
  contact?: string;
  category: IncidentCategory;
  people: number;
  description?: string;
  urgency: Urgency;
  location: RequestLocation;
  etaMinutes: number;
  etaFallback: boolean;
  status: RequestStatus;
}

export const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  medical: "Medical emergency",
  injury: "Injury",
  evacuation: "Evacuation assistance",
  other: "Other",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  created: "Request created",
  awaiting: "Awaiting assignment",
  assigned: "Simulated team assigned",
  completed: "Completed",
};

export const PATIENT_STATUS_LABEL: Record<PatientStatus, string> = {
  awaiting: "Awaiting transport",
  in_transit: "In transit",
  evacuated: "Evacuated",
};
