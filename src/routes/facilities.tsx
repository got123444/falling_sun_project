import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SimLabel } from "@/components/med/bits";
import { Progress } from "@/components/ui/progress";
import { getNode } from "@/lib/sim/data";
import { useSim } from "@/lib/sim/store";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Facilities — MEDIVAC Command (demo)" },
      { name: "description", content: "Simulated medical facilities with capacity and bed availability." },
      { property: "og:title", content: "Facilities — MEDIVAC Command" },
      { property: "og:description", content: "Fictional facility capacity at a glance." },
    ],
  }),
  component: Facilities,
});

function Facilities() {
  const { world } = useSim();
  return (
    <div>
      <PageHeader title="Facilities" sub="Fictional facilities. Assigning a patient reserves a bed; the triage board blocks over-capacity assignments unless you override." actions={<SimLabel />} />
      <div className="grid gap-4 sm:grid-cols-2">
        {world.facilities.map((f) => {
          const free = f.capacity - f.occupied;
          const inbound = world.patients.filter((p) => p.facilityId === f.id && p.status !== "evacuated").length;
          return (
            <div key={f.id} className="panel lift p-5">
              <div className="flex items-start justify-between">
                <div><h2 className="font-semibold">{f.name}</h2><p className="text-xs text-muted-foreground">{getNode(f.node).label}</p></div>
                <span className={`font-mono text-2xl font-semibold ${free <= 0 ? "text-urgent" : free <= 2 ? "text-monitor" : "text-routine"}`}>{free}<span className="text-xs text-muted-foreground"> free</span></span>
              </div>
              <Progress className="mt-4" value={Math.min(100, (f.occupied / f.capacity) * 100)} />
              <p className="mt-2 text-xs text-muted-foreground">{f.occupied}/{f.capacity} beds used · {inbound} assigned and not yet arrived</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
