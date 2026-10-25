import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/med/bits";
import { patientRows, toCsv } from "@/lib/sim/report";
import { formatSimTime } from "@/lib/sim/simulation";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_META } from "@/lib/sim/triage";
import { PATIENT_STATUS_LABEL, STATUS_LABEL } from "@/lib/sim/types";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Incident report — MEDIVAC Command (demo)" },
      { name: "description", content: "Structured incident summary generated from simulated data, downloadable as CSV or printable." },
      { property: "og:title", content: "Incident report — MEDIVAC Command" },
      { property: "og:description", content: "Simulated incident summary." },
    ],
  }),
  component: Report,
});

function Report() {
  const { world, speedKmh, requests } = useSim();
  const rows = patientRows(world, speedKmh);
  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `medivac-simulated-report-${formatSimTime(world.minute).replace(/[:+]/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print">
        <PageHeader title="Incident report" actions={<><Button onClick={download}><Download /> CSV</Button><Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button></>} />
      </div>
      <article className="panel print-plain space-y-6 p-6 text-sm">
        <header>
          <p className="font-mono text-xs font-semibold tracking-widest text-monitor">GENERATED FROM SIMULATED DATA — NOT FOR CLINICAL USE</p>
          <h2 className="mt-2 text-lg font-semibold">Kestrel Valley training exercise · {formatSimTime(world.minute)}</h2>
        </header>
        <Sec t="Patients">
          <p>{rows.length} fictional patients. {Object.entries(CATEGORY_META).map(([k, v]) => `${v.label}: ${rows.filter((r) => r.priority === k).length}`).join(" · ")}</p>
          <p>{Object.entries(PATIENT_STATUS_LABEL).map(([k, v]) => `${v}: ${rows.filter((r) => r.status === k).length}`).join(" · ")}</p>
        </Sec>
        <Sec t="Facility capacity">
          <ul>{world.facilities.map((f) => <li key={f.id}>{f.name}: {f.occupied}/{f.capacity} beds used</li>)}</ul>
        </Sec>
        <Sec t="Reported hazards">
          <ul>{world.hazards.map((h) => <li key={h.id}>{h.label} — {h.active ? (h.severity === "blocked" ? "road closed" : "slow") : "cleared"}</li>)}</ul>
        </Sec>
        <Sec t="Demo assistance requests">
          <p>{requests.length} total. {Object.entries(STATUS_LABEL).map(([k, v]) => `${v}: ${requests.filter((r) => r.status === k).length}`).join(" · ")}</p>
        </Sec>
      </article>
    </div>
  );
}

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <section><h3 className="eyebrow mb-1.5">{t}</h3><div className="space-y-1">{children}</div></section>;
}
