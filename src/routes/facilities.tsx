import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SimLabel } from "@/components/med/bits";
import { getNode } from "@/lib/sim/data";
import { useSim } from "@/lib/sim/store";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Hospitals — MEDIVAC Command" },
      { name: "description", content: "Bed use and incoming patients for each Delhi hospital in the exercise." },
      { property: "og:title", content: "Hospitals — MEDIVAC Command" },
      { property: "og:description", content: "Simulated bed capacity across Delhi hospitals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Facilities,
});

function Facilities() {
  const { world } = useSim();
  return (
    <div className="fade-up">
      <PageHeader title="Hospitals" sub="Real hospital names, simulated bed numbers." actions={<SimLabel />} />
      <div className="grid gap-4 sm:grid-cols-2">
        {world.facilities.map((f) => {
          const pct = Math.round((f.occupied / f.capacity) * 100);
          const incoming = world.patients.filter((p) => p.facilityId === f.id && p.status === "in_transit").length;
          const tone = pct >= 90 ? "bg-urgent" : pct >= 70 ? "bg-monitor" : "bg-routine";
          return (
            <div key={f.id} className="panel p-5">
              <p className="font-semibold">{f.name}</p>
              <p className="text-xs text-muted-foreground">{getNode(f.node).label}</p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-semibold tabular-nums">{f.occupied}/{f.capacity}</span>
                <span className="text-sm text-muted-foreground">{f.capacity - f.occupied} beds free · {incoming} on the way</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
