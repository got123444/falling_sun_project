import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, PriorityBadge, SimLabel } from "@/components/med/bits";
import { SchematicMap } from "@/components/med/SchematicMap";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { EDGES, getNode } from "@/lib/sim/data";
import { alternativePath, hazardsAvoided, shortestPath } from "@/lib/sim/routing";
import { suggestFacility } from "@/lib/sim/simulation";
import { useSim } from "@/lib/sim/store";
import { assessPriority } from "@/lib/sim/triage";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map & routes — MEDIVAC Command (demo)" },
      { name: "description", content: "Delhi NCR reference map with simulated patients, facilities, hazards and route estimates." },
      { property: "og:title", content: "Map & routes — MEDIVAC Command" },
      { property: "og:description", content: "Approximate Delhi landmarks with simulated hazard-aware route estimates." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { world, speedKmh, setSpeedKmh, toggleHazard } = useSim();
  const open = world.patients.filter((p) => p.status !== "evacuated");
  const [sel, setSel] = useState<string | undefined>(open[0]?.id);
  const p = world.patients.find((x) => x.id === sel);

  const info = useMemo(() => {
    if (!p) return null;
    const f = p.facilityId ? world.facilities.find((x) => x.id === p.facilityId)! : suggestFacility(p, world.facilities, world.hazards, speedKmh)?.facility;
    if (!f) return { f: null };
    const opts = { hazards: world.hazards, speedKmh };
    const route = shortestPath(EDGES, p.node, f.node, opts);
    const alt = route ? alternativePath(EDGES, route, opts) : null;
    const avoided = route ? hazardsAvoided(EDGES, route, opts) : [];
    return { f, route, alt, avoided };
  }, [p, world.facilities, world.hazards, speedKmh]);

  const hzName = (id: string) => world.hazards.find((h) => h.id === id)?.label ?? id;

  return (
    <div>
      <PageHeader title="Delhi map & routes" sub="Delhi NCR landmarks with simulated patients and hazard-aware routes." actions={<SimLabel />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="panel p-2">
          <SchematicMap world={world} selected={sel} onSelect={setSel} route={info?.route} alt={info?.alt} />
          <div className="flex flex-wrap gap-4 px-2 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-urgent" />Urgent</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-monitor" />Monitor</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-routine" />Routine</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-info" />Facility</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-4 bg-primary" />Chosen route</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-monitor" />Alternative</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="panel p-4">
            <label className="eyebrow" htmlFor="pt">Patient</label>
            <select id="pt" className="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm" value={sel} onChange={(e) => setSel(e.target.value)}>
              {open.map((x) => <option key={x.id} value={x.id} className="bg-popover">{x.id} · {getNode(x.node).label}</option>)}
            </select>
            {p && (
              <div className="mt-3 space-y-2 text-sm">
                <PriorityBadge c={assessPriority(p.vitals).category} />
                {!info?.f ? <p className="text-urgent">No reachable facility with free beds.</p> : !info.route ? <p className="text-urgent">No open route to {info.f.name}.</p> : (
                  <>
                    <p>To <b>{info.f.name}</b>{!p.facilityId && <span className="text-muted-foreground"> (suggested)</span>}</p>
                    <p className="font-mono">{info.route.km} km · ~{info.route.minutes} sim min</p>
                    <p className="text-xs text-muted-foreground">Via {info.route.path.map((n) => getNode(n).label).join(" → ")}</p>
                    {info.route.hazardsEncountered.length > 0 && <p className="text-xs text-monitor">Passes through: {info.route.hazardsEncountered.map(hzName).join(", ")}</p>}
                    {info.avoided.length > 0 && <p className="text-xs text-routine">Avoided: {info.avoided.map(hzName).join(", ")}</p>}
                    {info.alt ? <p className="text-xs text-muted-foreground">Alternative: {info.alt.km} km · ~{info.alt.minutes} min</p> : <p className="text-xs text-muted-foreground">No alternative route available.</p>}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="panel p-4">
            <p className="eyebrow">Simulated vehicle speed · {speedKmh} km/h</p>
            <Slider className="mt-3" min={15} max={80} step={5} value={[speedKmh]} onValueChange={(v) => setSpeedKmh(v[0])} aria-label="Vehicle speed" />
          </div>
          <div className="panel p-4">
            <p className="eyebrow mb-2">Reported hazards</p>
            <ul className="space-y-2">
              {world.hazards.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{h.label} <span className={`text-xs ${h.severity === "blocked" ? "text-urgent" : "text-monitor"}`}>{h.severity === "blocked" ? "road closed" : "slow"}</span></span>
                  <Switch checked={h.active} onCheckedChange={() => toggleHazard(h.id)} aria-label={`Toggle ${h.label}`} />
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-muted-foreground">Approximate reference map. Patient locations, road links, facilities, distances, and traffic are simulated; not for real-world navigation.</p>
        </div>
      </div>
    </div>
  );
}
