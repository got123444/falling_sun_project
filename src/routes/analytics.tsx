import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SimLabel, Stat } from "@/components/med/bits";
import { useSim } from "@/lib/sim/store";
import { assessPriority } from "@/lib/sim/triage";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — MEDIVAC Command" },
      { name: "description", content: "Live counts of patients, priorities, beds and requests in the exercise." },
      { property: "og:title", content: "Analytics — MEDIVAC Command" },
      { property: "og:description", content: "The exercise at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { world, requests } = useSim();
  const ps = world.patients;
  const open = ps.filter((p) => p.status !== "evacuated");
  const cats = { urgent: 0, monitor: 0, routine: 0 };
  open.forEach((p) => cats[assessPriority(p.vitals).category]++);
  const cap = world.facilities.reduce((s, f) => s + f.capacity, 0);
  const occ = world.facilities.reduce((s, f) => s + f.occupied, 0);
  const avgEta = requests.length ? Math.round(requests.reduce((s, r) => s + r.etaMinutes, 0) / requests.length) : null;
  const max = Math.max(1, ...Object.values(cats));

  return (
    <div className="fade-up">
      <PageHeader title="Analytics" sub="Numbers update as the exercise runs." actions={<SimLabel />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting" value={ps.filter((p) => p.status === "awaiting").length} accent="monitor" />
        <Stat label="On the way" value={ps.filter((p) => p.status === "in_transit").length} accent="primary" />
        <Stat label="Reached hospital" value={ps.filter((p) => p.status === "evacuated").length} accent="routine" />
        <Stat label="Beds in use" value={`${Math.round((occ / cap) * 100)}%`} hint={`${occ} of ${cap}`} />
        <Stat label="Urgent now" value={cats.urgent} accent="urgent" />
        <Stat label="Requests" value={requests.length} />
        <Stat label="Average ETA" value={avgEta === null ? "—" : `${avgEta} min`} />
        <Stat label="Roads with problems" value={world.hazards.filter((h) => h.active).length} />
      </div>
      <div className="panel mt-4 p-5">
        <p className="eyebrow mb-3">Open patients by priority</p>
        {(["urgent", "monitor", "routine"] as const).map((c) => (
          <div key={c} className="mb-2 flex items-center gap-3 text-sm">
            <span className="w-20 capitalize">{c}</span>
            <div className="h-3 flex-1 rounded-full bg-muted">
              <div className={`h-full rounded-full ${{ urgent: "bg-urgent", monitor: "bg-monitor", routine: "bg-routine" }[c]}`} style={{ width: `${(cats[c] / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right font-mono">{cats[c]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
