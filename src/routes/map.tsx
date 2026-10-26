import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, SimLabel } from "@/components/med/bits";
import { EDGES, NODES, getNode } from "@/lib/sim/data";
import { alternativePath, edgeKey } from "@/lib/sim/routing";
import { useSim } from "@/lib/sim/store";
import { routeFor } from "@/lib/sim/simulation";
import { assessPriority } from "@/lib/sim/triage";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map & routes — MEDIVAC Command" },
      { name: "description", content: "Delhi area map with patients, hospitals, road problems and the fastest routes." },
      { property: "og:title", content: "Map & routes — MEDIVAC Command" },
      { property: "og:description", content: "See routes around blocked roads in Delhi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

const DOT = { urgent: "fill-urgent", monitor: "fill-monitor", routine: "fill-routine" };

function MapPage() {
  const { world, speedKmh, toggleHazard } = useSim();
  const [pid, setPid] = useState<string>("");
  const [fid, setFid] = useState<string>(world.facilities[0].id);

  const patient = world.patients.find((p) => p.id === pid);
  const facility = world.facilities.find((f) => f.id === fid)!;
  const route = useMemo(() => (patient ? routeFor(patient, facility, world.hazards, speedKmh) : null), [patient, facility, world.hazards, speedKmh]);
  const alt = useMemo(() => (route ? alternativePath(EDGES, route, { hazards: world.hazards, speedKmh }) : null), [route, world.hazards, speedKmh]);
  const onRoute = new Set(route ? route.path.slice(1).map((n, i) => edgeKey(route.path[i], n)) : []);
  const hz = new Map(world.hazards.filter((h) => h.active).map((h) => [edgeKey(...h.edge), h]));

  return (
    <div className="fade-up">
      <PageHeader title="Map & routes" sub="Real Delhi areas on a simplified road network. Pick a patient and a hospital to see the fastest way around trouble." actions={<SimLabel />} />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="panel p-2">
          <svg viewBox="0 0 1000 620" className="h-auto w-full" role="img" aria-label="Delhi road map">
            {EDGES.map(([a, b]) => {
              const A = getNode(a), B = getNode(b), k = edgeKey(a, b), h = hz.get(k);
              return (
                <line key={k} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  className={onRoute.has(k) ? "stroke-primary" : h ? (h.severity === "blocked" ? "stroke-urgent" : "stroke-monitor") : "stroke-border"}
                  strokeWidth={onRoute.has(k) ? 6 : 3} strokeDasharray={h ? "8 6" : undefined} />
              );
            })}
            {NODES.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={5} className="fill-muted-foreground" />
                <text x={n.x + 8} y={n.y - 8} className="fill-foreground text-[13px] font-medium">{n.label}</text>
              </g>
            ))}
            {world.facilities.map((f) => {
              const n = getNode(f.node);
              return <rect key={f.id} x={n.x - 9} y={n.y + 8} width={18} height={18} rx={3} className="fill-info"><title>{f.name}</title></rect>;
            })}
            {world.patients.filter((p) => p.status !== "evacuated").map((p) => (
              <circle key={p.id} cx={p.x} cy={p.y} r={p.id === pid ? 9 : 6}
                className={`${DOT[assessPriority(p.vitals).category]} cursor-pointer stroke-background`} strokeWidth={2}
                onClick={() => setPid(p.id)}><title>{p.id}</title></circle>
            ))}
          </svg>
          <p className="px-2 pb-1 text-xs text-muted-foreground">Dots are patients (red = urgent), blue squares are hospitals, dashed roads have problems.</p>
        </div>
        <div className="space-y-4">
          <div className="panel space-y-3 p-4 text-sm">
            <label className="block"><span className="eyebrow">Patient</span>
              <select className="mt-1 w-full rounded-md border bg-background px-2 py-1.5" value={pid} onChange={(e) => setPid(e.target.value)}>
                <option value="">Choose a patient…</option>
                {world.patients.filter((p) => p.status !== "evacuated").map((p) => <option key={p.id} value={p.id}>{p.id} · {getNode(p.node).label}</option>)}
              </select>
            </label>
            <label className="block"><span className="eyebrow">Hospital</span>
              <select className="mt-1 w-full rounded-md border bg-background px-2 py-1.5" value={fid} onChange={(e) => setFid(e.target.value)}>
                {world.facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            {patient && (route ? (
              <div className="rounded-md border bg-panel p-3">
                <p className="font-mono text-2xl font-semibold">{route.minutes} min</p>
                <p className="text-xs text-muted-foreground">{route.km} km · {route.path.map((n) => getNode(n).label).join(" → ")}</p>
                {alt && <p className="mt-2 text-xs">Backup route: {alt.minutes} min via {alt.path.slice(1, -1).map((n) => getNode(n).label).join(", ") || "direct"}</p>}
              </div>
            ) : <p className="text-urgent">No open road to this hospital right now.</p>)}
          </div>
          <div className="panel p-4">
            <p className="eyebrow mb-2">Road problems</p>
            <ul className="space-y-2 text-sm">
              {world.hazards.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2">
                  <span>{h.label}<span className="block text-xs text-muted-foreground">{getNode(h.edge[0]).label} – {getNode(h.edge[1]).label} · {h.severity === "blocked" ? "closed" : "slow"}</span></span>
                  <Button size="sm" variant={h.active ? "destructive" : "outline"} onClick={() => toggleHazard(h.id)}>{h.active ? "Clear" : "Report"}</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
