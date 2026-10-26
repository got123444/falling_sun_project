import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/med/bits";
import { useSim } from "@/lib/sim/store";
import { formatSimTime } from "@/lib/sim/simulation";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Exercise report — MEDIVAC Command" },
      { name: "description", content: "A printable summary and event log of the Delhi training exercise." },
      { property: "og:title", content: "Exercise report — MEDIVAC Command" },
      { property: "og:description", content: "Summary and timeline of the exercise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Report,
});

function Report() {
  const { world, requests } = useSim();
  const ps = world.patients;
  return (
    <div className="fade-up">
      <PageHeader
        title="Exercise report"
        sub={`Delhi training exercise · simulated time ${formatSimTime(world.minute)}`}
        actions={<Button size="sm" variant="outline" className="no-print" onClick={() => window.print()}><Printer /> Print</Button>}
      />
      <div className="panel mb-4 grid gap-2 p-5 text-sm sm:grid-cols-2">
        <p>Patients in exercise: <b>{ps.length}</b></p>
        <p>Reached hospital: <b>{ps.filter((p) => p.status === "evacuated").length}</b></p>
        <p>Help requests: <b>{requests.length}</b></p>
        <p>Road problems active: <b>{world.hazards.filter((h) => h.active).length}</b></p>
      </div>
      <div className="panel p-5">
        <p className="eyebrow mb-3">Event log</p>
        <ol className="space-y-1.5 text-sm">
          {world.log.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{formatSimTime(e.minute)}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">All patients, vitals and dispatches are simulated. No real emergency services were contacted.</p>
    </div>
  );
}
