import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TriageCategory } from "@/lib/sim/triage";
import { CATEGORY_META } from "@/lib/sim/triage";
import type { PatientStatus, RequestStatus, Urgency } from "@/lib/sim/types";
import { PATIENT_STATUS_LABEL, STATUS_LABEL, URGENCY_LABEL } from "@/lib/sim/types";

const tone = {
  urgent: "bg-urgent/15 text-urgent border-urgent/30",
  monitor: "bg-monitor/15 text-monitor border-monitor/30",
  routine: "bg-routine/15 text-routine border-routine/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/15 text-primary border-primary/30",
};

export function Pill({ t, children, className }: { t: keyof typeof tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tone[t], className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ c }: { c: TriageCategory }) {
  return (
    <Pill t={c}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {CATEGORY_META[c].label}
    </Pill>
  );
}

export function UrgencyBadge({ u }: { u: Urgency }) {
  const t = u === "critical" ? "urgent" : u === "high" ? "monitor" : u === "moderate" ? "info" : "muted";
  return <Pill t={t}>{URGENCY_LABEL[u]}</Pill>;
}

export function RequestStatusBadge({ s }: { s: RequestStatus }) {
  const t = s === "completed" ? "routine" : s === "assigned" ? "primary" : s === "awaiting" ? "monitor" : "info";
  return <Pill t={t}>{STATUS_LABEL[s]}</Pill>;
}

export function PatientStatusBadge({ s }: { s: PatientStatus }) {
  const t = s === "evacuated" ? "routine" : s === "in_transit" ? "primary" : "muted";
  return <Pill t={t}>{PATIENT_STATUS_LABEL[s]}</Pill>;
}

export function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: "urgent" | "monitor" | "routine" | "primary" }) {
  const color = accent ? { urgent: "text-urgent", monitor: "text-monitor", routine: "text-routine", primary: "text-primary" }[accent] : "text-foreground";
  return (
    <div className="panel p-4">
      <div className="eyebrow">{label}</div>
      <div className={cn("mt-1.5 font-mono text-2xl font-semibold tabular-nums", color)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SimLabel() {
  return <Pill t="monitor" className="font-mono text-[10px] tracking-wider">SIMULATED DATA</Pill>;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
