import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Pause, Play, RotateCcw, Search, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PageHeader, PatientStatusBadge, PriorityBadge, SimLabel } from "@/components/med/bits";
import { getNode } from "@/lib/sim/data";
import { formatSimTime, routeFor, suggestFacility } from "@/lib/sim/simulation";
import { useSim } from "@/lib/sim/store";
import { assessPriority, CATEGORY_META, type TriageCategory } from "@/lib/sim/triage";
import { PATIENT_STATUS_LABEL, type PatientStatus } from "@/lib/sim/types";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Triage board — MEDIVAC Command (demo)" },
      { name: "description", content: "Live simulated patient observations with explainable demonstration priority rules." },
      { property: "og:title", content: "Triage board — MEDIVAC Command" },
      { property: "og:description", content: "Explainable, rules-based demo triage on fictional patients." },
    ],
  }),
  component: Triage,
});

type SortKey = "priority" | "id" | "hr" | "spo2" | "rr" | "sbp" | "eta";
const sel = "h-9 rounded-md border border-input bg-transparent px-2 text-sm";

function Triage() {
  const sim = useSim();
  const { world, speedKmh } = sim;
  const [q, setQ] = useState("");
  const [pf, setPf] = useState<TriageCategory | "">("");
  const [sf, setSf] = useState<PatientStatus | "">("");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "priority", dir: 1 });
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = world.patients.map((p) => {
      const t = assessPriority(p.vitals);
      const f = p.facilityId ? world.facilities.find((x) => x.id === p.facilityId) : undefined;
      const s = f ? null : suggestFacility(p, world.facilities, world.hazards, speedKmh);
      const fac = f ?? s?.facility;
      const r = fac ? routeFor(p, fac, world.hazards, speedKmh) : null;
      return { p, t, fac, suggested: !f, eta: r?.minutes ?? null };
    });
    const val = (r: (typeof list)[0]): number | string => {
      switch (sort.k) {
        case "priority": return CATEGORY_META[r.t.category].rank * 100 - r.t.score;
        case "id": return r.p.id;
        case "eta": return r.eta ?? 9999;
        default: return r.p.vitals[sort.k] ?? -1;
      }
    };
    return list
      .filter((r) => (!pf || r.t.category === pf) && (!sf || r.p.status === sf) && (!q || `${r.p.id} ${getNode(r.p.node).label}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [world, q, pf, sf, sort, speedKmh]);

  const th = (k: SortKey, label: string) => (
    <th className="px-3 py-2 font-medium">
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : 1 }))}>
        {label}<ArrowUpDown className="size-3" />
      </button>
    </th>
  );
  const sp = open ? rows.find((r) => r.p.id === open) ?? null : null;
  const fail = (r: { ok: boolean; reason?: string }) => !r.ok && toast.error((r as { reason: string }).reason);

  const active = world.patients.filter((p) => p.status !== "evacuated");
  const etas = rows.filter((r) => r.p.status === "awaiting" && r.eta != null).map((r) => r.eta!);

  return (
    <div>
      <PageHeader
        title="Triage board"
        sub="Fictional patients. Priority comes from simple, visible demo rules — never real clinical guidance."
        actions={<SimLabel />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Mini label="Patients" v={world.patients.length} />
        <Mini label="Urgent review" v={active.filter((p) => assessPriority(p.vitals).category === "urgent").length} c="text-urgent" />
        <Mini label="Awaiting evacuation" v={world.patients.filter((p) => p.status === "awaiting").length} c="text-monitor" />
        <Mini label="Facilities with beds" v={world.facilities.filter((f) => f.capacity > f.occupied).length} c="text-routine" />
        <Mini label="Avg est. evac time" v={etas.length ? `${Math.round(etas.reduce((a, b) => a + b, 0) / etas.length)}m` : "—"} />
      </div>

      <div className="panel mt-4 flex flex-wrap items-center gap-3 p-3">
        <Button size="sm" onClick={() => sim.setRunning(!sim.running)}>{sim.running ? <Pause /> : <Play />}{sim.running ? "Pause" : "Start"}</Button>
        <Button size="sm" variant="outline" onClick={() => { sim.reset(); toast("Simulation reset"); }}><RotateCcw /> Reset</Button>
        <Button size="sm" variant="outline" onClick={() => sim.triggerChange()}><Zap /> Trigger vital change</Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Speed {sim.speed}×
          <Slider className="w-28" min={1} max={8} step={1} value={[sim.speed]} onValueChange={(v) => sim.setSpeed(v[0])} aria-label="Simulation speed" />
        </div>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{formatSimTime(world.minute)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search patient or place" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={sel} value={pf} onChange={(e) => setPf(e.target.value as TriageCategory | "")} aria-label="Priority filter">
          <option value="" className="bg-popover">All priorities</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k} className="bg-popover">{v.label}</option>)}
        </select>
        <select className={sel} value={sf} onChange={(e) => setSf(e.target.value as PatientStatus | "")} aria-label="Status filter">
          <option value="" className="bg-popover">All statuses</option>
          {Object.entries(PATIENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k} className="bg-popover">{v}</option>)}
        </select>
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">{th("id", "Patient")}<th className="px-3 py-2 font-medium">Location</th>{th("hr", "HR")}{th("spo2", "SpO₂")}{th("rr", "RR")}{th("sbp", "SBP")}{th("priority", "Priority")}<th className="px-3 py-2 font-medium">Why</th><th className="px-3 py-2 font-medium">Destination</th>{th("eta", "ETA")}<th className="px-3 py-2 font-medium">Status</th></tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.length === 0 && <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No patients match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.p.id} onClick={() => setOpen(r.p.id)} className={`cursor-pointer border-b last:border-0 hover:bg-secondary/60 ${open === r.p.id ? "bg-secondary" : ""}`}>
                  <td className="px-3 py-2 font-mono text-xs">{r.p.id}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{getNode(r.p.node).label}</td>
                  <V v={r.p.vitals.hr} /><V v={r.p.vitals.spo2} /><V v={r.p.vitals.rr} /><V v={r.p.vitals.sbp} />
                  <td className="px-3 py-2"><PriorityBadge c={r.t.category} /></td>
                  <td className="max-w-56 truncate px-3 py-2 text-xs text-muted-foreground" title={r.t.summary}>{r.t.summary}</td>
                  <td className="px-3 py-2 text-xs">{r.fac?.name ?? "—"}{r.suggested && r.fac && <span className="text-muted-foreground"> ·sugg.</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.eta != null ? `${r.eta}m` : "—"}</td>
                  <td className="px-3 py-2"><PatientStatusBadge s={r.p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4">
          {sp ? (
            <div className="panel fade-up space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div><p className="eyebrow">Fictional patient</p><p className="font-mono text-lg font-semibold">{sp.p.id}</p><p className="text-xs text-muted-foreground">near {getNode(sp.p.node).label}</p></div>
                <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setOpen(null)}><X /></Button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {(["hr", "spo2", "rr", "sbp"] as const).map((k) => (
                  <div key={k} className="rounded-md bg-panel p-2"><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="font-mono font-semibold">{sp.p.vitals[k] ?? "—"}</p></div>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between"><PriorityBadge c={sp.t.category} /><span className="font-mono text-xs text-muted-foreground">score {sp.t.score}</span></div>
                <ul className="mt-2 space-y-1 text-xs">
                  {sp.t.contributions.length === 0 && <li className="text-muted-foreground">No rules triggered.</li>}
                  {sp.t.contributions.map((c, i) => <li key={i} className="flex justify-between gap-2"><span>{c.detail}</span><span className="font-mono text-monitor">+{c.points}</span></li>)}
                </ul>
              </div>
              <div>
                <label className="eyebrow" htmlFor="dest">Destination</label>
                <select id="dest" className={`${sel} mt-1.5 w-full`} value={sp.p.facilityId ?? ""} onChange={(e) => {
                  const f = world.facilities.find((x) => x.id === e.target.value)!;
                  const full = f.capacity - f.occupied <= 0;
                  if (full && !confirm(`${f.name} has no free beds. Override capacity anyway?`)) return;
                  const r = sim.assignFacility(sp.p.id, f.id, full);
                  if (!fail(r)) toast.success(`${sp.p.id} → ${f.name}`);
                }}>
                  <option value="" disabled className="bg-popover">{sp.fac ? `Suggested: ${sp.fac.name}` : "Choose facility"}</option>
                  {world.facilities.map((f) => <option key={f.id} value={f.id} className="bg-popover">{f.name} ({f.capacity - f.occupied} free)</option>)}
                </select>
                {sp.p.override && <p className="mt-1 text-xs text-monitor">Assigned over capacity (override).</p>}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Button size="sm" variant={sp.p.status === "awaiting" ? "default" : "outline"} onClick={() => fail(sim.setPatientStatus(sp.p.id, "awaiting"))}>Awaiting</Button>
                <Button size="sm" variant={sp.p.status === "in_transit" ? "default" : "outline"} onClick={() => fail(sim.setPatientStatus(sp.p.id, "in_transit"))}>Dispatch</Button>
                <Button size="sm" variant={sp.p.status === "evacuated" ? "default" : "outline"} onClick={() => fail(sim.setPatientStatus(sp.p.id, "evacuated"))}>Evacuated</Button>
              </div>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => sim.triggerChange(sp.p.id)}><Zap /> Simulate a deterioration</Button>
            </div>
          ) : (
            <div className="panel p-5 text-sm text-muted-foreground">Select a patient to see why they got their priority.</div>
          )}
          <div className="panel p-4">
            <p className="eyebrow mb-2">Event log</p>
            <ul className="max-h-72 space-y-1.5 overflow-y-auto text-xs">
              {world.log.slice(0, 40).map((l) => (
                <li key={l.id} className="flex gap-2"><span className="shrink-0 font-mono text-muted-foreground">{formatSimTime(l.minute)}</span><span>{l.text}</span></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function V({ v }: { v: number | null }) {
  return <td className="px-3 py-2 font-mono text-xs">{v ?? <span className="text-monitor">—</span>}</td>;
}
function Mini({ label, v, c }: { label: string; v: React.ReactNode; c?: string }) {
  return <div className="panel p-3"><p className="eyebrow">{label}</p><p className={`mt-1 font-mono text-xl font-semibold ${c ?? ""}`}>{v}</p></div>;
}
