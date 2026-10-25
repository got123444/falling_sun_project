import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createInitialWorld } from "./data";
import { parseStoredRequests } from "./requests";
import {
  addLog,
  assignFacility as assignFn,
  changeVitals,
  setPatientStatus as statusFn,
  tickWorld,
  type AssignResult,
} from "./simulation";
import type { DemoRequest, Patient, RequestStatus, World } from "./types";

const REQ_KEY = "medivac.requests.v1";

interface SimContext {
  world: World;
  running: boolean;
  speed: number;
  speedKmh: number;
  setRunning: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setSpeedKmh: (v: number) => void;
  reset: () => void;
  triggerChange: (patientId?: string) => void;
  assignFacility: (patientId: string, facilityId: string, override: boolean) => AssignResult;
  setPatientStatus: (patientId: string, status: Patient["status"]) => AssignResult;
  toggleHazard: (id: string) => void;
  requests: DemoRequest[];
  requestsLoaded: boolean;
  addRequest: (r: DemoRequest) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  clearRequests: () => void;
}

const Ctx = createContext<SimContext | null>(null);

export function SimProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<World>(() => createInitialWorld());
  const worldRef = useRef(world);
  worldRef.current = world;
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [speedKmh, setSpeedKmh] = useState(40);
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [requestsLoaded, setLoaded] = useState(false);

  useEffect(() => {
    setRequests(parseStoredRequests(window.localStorage.getItem(REQ_KEY)));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (requestsLoaded) window.localStorage.setItem(REQ_KEY, JSON.stringify(requests));
  }, [requests, requestsLoaded]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setWorld((w) => tickWorld(w)), 2500 / speed);
    return () => window.clearInterval(t);
  }, [running, speed]);

  const apply = useCallback((fn: (w: World) => AssignResult): AssignResult => {
    const r = fn(worldRef.current);
    if (r.ok) {
      worldRef.current = r.world;
      setWorld(r.world);
    }
    return r;
  }, []);

  const value = useMemo<SimContext>(
    () => ({
      world,
      running,
      speed,
      speedKmh,
      setRunning,
      setSpeed,
      setSpeedKmh,
      reset: () => {
        setWorld(createInitialWorld());
        setRunning(true);
      },
      triggerChange: (patientId) =>
        setWorld((w) => {
          const open = w.patients.filter((p) => p.status !== "evacuated");
          const id = patientId ?? open[(w.tick * 13 + w.nextLogId) % Math.max(1, open.length)]?.id;
          return id ? changeVitals({ ...w, tick: w.tick }, id, true, w.nextLogId) : w;
        }),
      assignFacility: (p, f, o) => apply((w) => assignFn(w, p, f, o)),
      setPatientStatus: (p, s) => apply((w) => statusFn(w, p, s, speedKmh)),
      toggleHazard: (id) =>
        setWorld((w) => {
          const h = w.hazards.find((x) => x.id === id);
          if (!h) return w;
          return addLog(
            { ...w, hazards: w.hazards.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) },
            "system",
            `Hazard "${h.label}" ${h.active ? "cleared" : "reported"}`,
          );
        }),
      requests,
      requestsLoaded,
      addRequest: (r) => {
        setRequests((rs) => [r, ...rs]);
        setWorld((w) => addLog(w, "request", `Demo request ${r.id} created (${r.mode})`));
      },
      updateRequestStatus: (id, status) => setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r))),
      clearRequests: () => setRequests([]),
    }),
    [world, running, speed, speedKmh, requests, requestsLoaded, apply],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSim() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSim must be used inside SimProvider");
  return c;
}
