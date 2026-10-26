import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardEdit, MapPin, Zap } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { assessPriority } from "@/lib/sim/triage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Get help — MEDIVAC Command (demo)" },
      { name: "description", content: "Request simulated emergency assistance in two ways: a detailed form or a one-tap quick request." },
      { property: "og:title", content: "MEDIVAC Command — Emergency assistance, coordinated" },
      { property: "og:description", content: "A hackathon prototype for triage and evacuation coordination. Simulated dispatch only." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { requests, world, running } = useSim();
  const active = requests.filter((r) => r.status !== "completed").length;
  const urgent = world.patients.filter((p) => p.status !== "evacuated" && assessPriority(p.vitals).category === "urgent").length;
  const beds = world.facilities.reduce((s, f) => s + Math.max(0, f.capacity - f.occupied), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <section className="grid gap-10 pt-4 lg:grid-cols-[1.2fr_1fr] lg:pt-10">
        <div className="fade-up">
          <p className="eyebrow">Delhi · training exercise</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Emergency assistance,
            <br />
            <span className="text-primary">coordinated.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Two ways to ask for help. Tell us the details if you have a minute, or tap once and we'll work from your location.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            This is a demonstration. Nothing here reaches a real dispatcher — in a real emergency, call your local emergency number.
          </p>
        </div>

        <aside className="panel fade-up self-start p-5 [animation-delay:80ms]" aria-label="System status">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Demo system status</p>
            <span className="flex items-center gap-1.5 text-xs text-routine">
              <span className="size-1.5 animate-pulse rounded-full bg-routine" aria-hidden />
              {running ? "Available" : "Paused"}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Active requests" value={active} />
            <Metric label="Urgent patients" value={urgent} tone="text-urgent" />
            <Metric label="Free beds" value={beds} tone="text-routine" />
          </dl>
          <Link to="/requests" className="mt-4 flex items-center gap-1 text-xs text-primary hover:underline">
            Open the coordination dashboard <ArrowRight className="size-3" />
          </Link>
        </aside>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Request modes">
        <Link to="/request/quick" className="panel lift group relative overflow-hidden border-urgent/30 p-6 fade-up [animation-delay:120ms]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-urgent/15 text-urgent">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="eyebrow text-urgent">Mode B</p>
              <h2 className="text-lg font-semibold">Quick request</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            One button. We ask for your location, create the request and show you a simulated arrival estimate. About ten seconds.
          </p>
          <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-urgent">
            I need help now <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>

        <Link to="/request/detailed" className="panel lift group p-6 fade-up [animation-delay:160ms]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <ClipboardEdit className="size-5" />
            </span>
            <div>
              <p className="eyebrow text-primary">Mode A</p>
              <h2 className="text-lg font-semibold">Detailed request</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A short form: who you are, what happened, how many people, and where. Better information means a better-matched response.
          </p>
          <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-primary">
            Fill in details <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        Location is only read when you press a button and allow it. Coordinates are rounded and kept in this browser only.
      </p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dt className="text-[11px] leading-tight text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}
