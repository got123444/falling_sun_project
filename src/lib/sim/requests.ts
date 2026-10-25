import { estimateEta } from "./eta";
import type { DemoRequest, IncidentCategory, RequestLocation, Urgency } from "./types";

export interface DetailedForm {
  name: string;
  contact: string;
  category: IncidentCategory | "";
  people: string;
  description: string;
  urgency: Urgency | "";
  locationText: string;
  coords: { lat: number; lng: number; accuracy?: number } | null;
}

export type FormErrors = Partial<Record<keyof DetailedForm | "location", string>>;

export function validateDetailed(f: DetailedForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = "Please tell us who is asking for help.";
  else if (f.name.trim().length > 80) e.name = "Keep the name under 80 characters.";
  if (f.contact.trim() && !/^[+\d][\d\s()-]{5,19}$/.test(f.contact.trim())) e.contact = "That doesn't look like a phone number.";
  if (!f.category) e.category = "Choose the closest incident type.";
  const n = Number(f.people);
  if (!f.people.trim() || !Number.isInteger(n)) e.people = "Enter a whole number.";
  else if (n < 1 || n > 200) e.people = "Between 1 and 200 people.";
  if (f.description.length > 500) e.description = "Keep it under 500 characters.";
  if (!f.urgency) e.urgency = "Pick how urgent this feels to you.";
  if (!f.coords && !f.locationText.trim()) e.location = "Share your location or describe where you are.";
  return e;
}

export function makeRequestId(now: number, rand: number): string {
  return `MV-${now.toString(36).slice(-5).toUpperCase()}${Math.floor(rand * 1296).toString(36).padStart(2, "0").toUpperCase()}`;
}

/** ~110 m precision is plenty for a demo and avoids storing exact coordinates. */
export const roundCoord = (x: number) => Math.round(x * 1000) / 1000;

export function buildRequest(args: {
  id: string;
  mode: DemoRequest["mode"];
  createdAt: string;
  category: IncidentCategory;
  urgency: Urgency;
  people: number;
  location: RequestLocation;
  name?: string;
  contact?: string;
  description?: string;
}): DemoRequest {
  const hasCoordinates = args.location.kind === "gps";
  const eta = estimateEta({ id: args.id, category: args.category, urgency: args.urgency, hasCoordinates });
  const location = hasCoordinates
    ? { ...args.location, lat: roundCoord(args.location.lat!), lng: roundCoord(args.location.lng!) }
    : args.location;
  return { ...args, location, etaMinutes: eta.minutes, etaFallback: eta.fallback, status: "created" };
}

export function isDemoRequest(x: unknown): x is DemoRequest {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.category === "string" &&
    typeof r.urgency === "string" &&
    typeof r.etaMinutes === "number" &&
    typeof r.status === "string" &&
    !!r.location &&
    typeof r.location === "object"
  );
}

export function parseStoredRequests(raw: string | null): DemoRequest[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isDemoRequest) : [];
  } catch {
    return [];
  }
}

export type GeoResult =
  | { ok: true; lat: number; lng: number; accuracy: number }
  | { ok: false; reason: "denied" | "unavailable" | "timeout" | "unsupported" };

export function getBrowserLocation(timeout = 10000): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve({ ok: false, reason: "unsupported" });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (err) => resolve({ ok: false, reason: err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable" }),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    );
  });
}

export const GEO_MESSAGE: Record<Exclude<GeoResult, { ok: true }>["reason"], string> = {
  denied: "Location permission was declined. That's fine — describe where you are instead.",
  unavailable: "We couldn't find your position right now. Type a landmark or address instead.",
  timeout: "Finding your location took too long. Type a landmark or address instead.",
  unsupported: "This browser can't share location. Type a landmark or address instead.",
};
