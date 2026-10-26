import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BarChart3, Building2, ClipboardList, FileText, LifeBuoy, Map, Pause, Play, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { useSim } from "@/lib/sim/store";
import { formatSimTime } from "@/lib/sim/simulation";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Get help", icon: LifeBuoy },
  { to: "/requests", label: "Requests", icon: ClipboardList },
  { to: "/triage", label: "Triage", icon: Stethoscope },
  { to: "/map", label: "Map & routes", icon: Map },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/report", label: "Report", icon: FileText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { world, running, setRunning, requests } = useSim();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = requests.filter((r) => r.status !== "completed").length;
  const isActive = (to: string) => (to === "/" ? path === "/" || path.startsWith("/request/") : path.startsWith(to));

  return (
    <div className="flex min-h-screen flex-col">
      <div role="note" className="no-print border-b border-monitor/30 bg-monitor/10 px-4 py-1.5 text-center font-mono text-[11px] tracking-wide text-monitor">
        DEMO MODE — SIMULATED DISPATCH. NO REAL EMERGENCY SERVICES ARE CONTACTED.
      </div>
      <div className="flex flex-1">
        <aside className="no-print sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-4" strokeWidth={2.5} />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-wide">MEDIVAC</span>
              <span className="block font-mono text-[10px] tracking-[0.2em] text-muted-foreground">COMMAND</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-0.5 px-3" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(n.to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <n.icon className={cn("size-4", isActive(n.to) && "text-primary")} />
                {n.label}
                {n.to === "/requests" && active > 0 && (
                  <span className="ml-auto rounded-full bg-primary/15 px-1.5 font-mono text-[10px] text-primary">{active}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-sidebar-border px-5 py-4 text-xs text-muted-foreground">
            <p>Delhi training scenario. Patients and incidents are simulated.</p>
            <p>Triage rules are for demonstration only — not clinical guidance.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-2.5 backdrop-blur md:px-6">
            <Link to="/" className="flex items-center gap-2 md:hidden">
              <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Activity className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-sm font-semibold">MEDIVAC</span>
            </Link>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className={cn("size-2 rounded-full", running ? "bg-routine" : "bg-monitor")} aria-hidden />
              {running ? "Simulation running" : "Simulation paused"}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-muted-foreground" aria-label="Simulation time">
                {formatSimTime(world.minute)}
              </span>
              <button
                onClick={() => setRunning(!running)}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-secondary active:scale-95"
                aria-label={running ? "Pause simulation" : "Resume simulation"}
              >
                {running ? <Pause className="size-3" /> : <Play className="size-3" />}
                {running ? "Pause" : "Resume"}
              </button>
            </div>
          </header>
          <nav className="no-print flex gap-1 overflow-x-auto border-b px-2 py-1.5 md:hidden" aria-label="Main mobile">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs", isActive(n.to) ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                <n.icon className="size-3.5" />
                {n.label}
              </Link>
            ))}
          </nav>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
