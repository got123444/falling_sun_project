import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, PatientStatusBadge, PriorityBadge, SimLabel } from "@/components/med/bits";
import { getNode } from "@/lib/sim/data";
import { useSim } from "@/lib/sim/store";
import { suggestFacility } from "@/lib/sim/simulation";
import { assessPriority, CATEGORY_META } from "@/lib/sim/triage";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Triage — MEDIVAC Command" },
      { name: "description", content: "Patients sorted by demo priority, with the reason behind each score." },
      { property: "og:title", content: "Triage — MEDIVAC Command" },
      { property: "og:description", content: "Who needs help first, and why." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Triage,
});

function Triage() {
  const { world, speedKmh, assignFacility, setPatientStatus, triggerChange } = useSim();
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = world.patients
    .filter((p) => p.status !== "evacuated")
    .map((p) => ({ p, t: assessPriority(p.vitals) }))
    .sort((a, b) => CATEGORY_META[a.t.category].rank - CATEGORY_META[b.t.category].rank || b.t.score - a.t.score);

  const dispatch = (id: string) => {
    const p = world.patients.find((x) => x.id === id)!;
    const s = suggestFacility(p, world.facilities, world.hazards, speedKmh);
    if (!s) return setMsg(`No reachable hospital with a free bed for ${id}.`);
    const a = assignFacility(id, s.facility.id, false);
    if (!a.ok) return setMsg(a.reason);
    const r = setPatientStatus(id, "in_transit");
    setMsg(r.ok ? `${id} sent to ${s.facility.name}, about ${s.route.minutes} min.` : r.reason);
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Triage"
        sub="Patients waiting or on the way, sorted by demo priority. These rules are for practice, not real medical decisions."
        actions={<><SimLabel /><Button size="sm" variant="outline" onClick={() => triggerChange()}>Make someone worse</Button></>}
      />
      {msg && <p role="status" className="mb-3 rounded-md border bg-panel px-3 py-2 text-sm">{msg}</p>}
      <div className="panel divide-y">
        {rows.map(({ p, t }) => (
          <div key={p.id} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-16 font-mono font-semibold">{p.id}</span>
              <PriorityBadge c={t.category} />
              <span className="text-sm text-muted-foreground">{getNode(p.node).label}</span>
              <span className="flex-1 text-sm">{t.summary}</span>
              <span className="font-mono text-xs text-muted-foreground">
                HR {p.vitals.hr ?? "—"} · SpO₂ {p.vitals.spo2 ?? "—"} · RR {p.vitals.rr ?? "—"} · BP {p.vitals.sbp ?? "—"}
              </span>
              <PatientStatusBadge s={p.status} />
              <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === p.id ? null : p.id)}>Why?</Button>
              {p.status === "awaiting" && <Button size="sm" onClick={() => dispatch(p.id)}>Send</Button>}
            </div>
            {openId === p.id && (
              <ul className="mt-3 space-y-1 pl-20 text-xs">
                {t.contributions.length === 0 && <li className="text-muted-foreground">No warning signs.</li>}
                {t.contributions.map((c, i) => (
                  <li key={i} className="flex justify-between gap-4"><span>{c.detail}</span><span className="font-mono">+{c.points}</span></li>
                ))}
                <li className="flex justify-between gap-4 border-t pt-1 font-semibold"><span>Total</span><span className="font-mono">{t.score}</span></li>
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
