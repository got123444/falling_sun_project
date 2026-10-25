import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SimLabel } from "@/components/med/bits";
import { patientRows } from "@/lib/sim/report";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_META } from "@/lib/sim/triage";
import { PATIENT_STATUS_LABEL } from "@/lib/sim/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — MEDIVAC Command (demo)" },
      { name: "description", content: "Charts of simulated priority, status, arrivals and evacuation times." },
      { property: "og:title", content: "Analytics — MEDIVAC Command" },
      { property: "og:description", content: "Live charts from the simulation." },
    ],
  }),
  component: Analytics,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };
const PC = { urgent: "var(--urgent)", monitor: "var(--monitor)", routine: "var(--routine)" };

function Analytics() {
  const { world, speedKmh } = useSim();
  const rows = patientRows(world, speedKmh);
  const pri = (Object.keys(CATEGORY_META) as (keyof typeof PC)[]).map((k) => ({ name: CATEGORY_META[k].label, k, v: rows.filter((r) => r.priority === k).length }));
  const st = (Object.keys(PATIENT_STATUS_LABEL) as (keyof typeof PATIENT_STATUS_LABEL)[]).map((k) => ({ name: PATIENT_STATUS_LABEL[k], v: rows.filter((r) => r.status === k).length }));
  const buckets = new Map<number, number>();
  for (const r of rows) { const b = Math.floor(r.arrivedAt / 10) * 10; buckets.set(b, (buckets.get(b) ?? 0) + 1); }
  const arr = [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([m, v]) => ({ name: `${m}m`, v }));
  const eta = rows.filter((r) => r.eta != null).map((r) => ({ name: r.id, v: r.eta }));

  return (
    <div>
      <PageHeader title="Analytics" sub="Everything here is computed live from the simulation." actions={<SimLabel />} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Demo priority distribution">
          <PieChart><Pie data={pri} dataKey="v" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>{pri.map((p) => <Cell key={p.k} fill={PC[p.k]} />)}</Pie><Tooltip {...tip} /></PieChart>
        </Card>
        <Card title="Patient status">
          <BarChart data={st}><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="v" name="Patients" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart>
        </Card>
        <Card title="Case arrivals (per 10 sim min)">
          <BarChart data={arr}><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="v" name="Cases" fill="var(--info)" radius={[4, 4, 0, 0]} /></BarChart>
        </Card>
        <Card title="Estimated evacuation time (assigned patients, min)">
          {eta.length ? <BarChart data={eta}><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="v" name="Minutes" fill="var(--monitor)" radius={[4, 4, 0, 0]} /></BarChart> : <p className="grid h-full place-items-center text-sm text-muted-foreground">Assign destinations on the triage board to see estimates.</p>}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow mb-3">{title}</p>
      <div className="h-60"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
    </div>
  );
}
