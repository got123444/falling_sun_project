import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge, UrgencyBadge } from "@/components/med/bits";
import { estimateEta, ETA_DISCLAIMER } from "@/lib/sim/eta";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_LABEL } from "@/lib/sim/types";

export const Route = createFileRoute("/request/$id")({
  head: () => ({
    meta: [
      { title: "Simulated request created — MEDIVAC Command" },
      { name: "description", content: "Confirmation of a simulated assistance request with its simulated ETA." },
      { property: "og:title", content: "Simulated request — MEDIVAC Command" },
      { property: "og:description", content: "Request ID, location status and simulated ETA." },
    ],
  }),
  component: Confirm,
});

function Confirm() {
  const { id } = Route.useParams();
  const { requests, requestsLoaded } = useSim();
  const r = requests.find((x) => x.id === id);

  if (!requestsLoaded) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!r)
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="font-medium">We couldn't find request {id}.</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been cleared from this browser.</p>
        <Button asChild className="mt-4"><Link to="/requests">Open dashboard</Link></Button>
      </div>
    );

  const eta = estimateEta({ id: r.id, category: r.category, urgency: r.urgency, hasCoordinates: r.location.kind === "gps" });
  const hasGps = r.location.kind === "gps" && r.location.lat != null && r.location.lng != null;

  return (
    <div className="mx-auto max-w-2xl fade-up">
      <div className="panel overflow-hidden">
        <div className="border-b bg-routine/10 px-6 py-5">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold tracking-widest text-routine">
            <CheckCircle2 className="size-4" /> SIMULATED REQUEST CREATED
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{r.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved to the demo dashboard. No real dispatcher has received this.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Item k="Status"><RequestStatusBadge s={r.status} /></Item>
            <Item k="Mode">{r.mode === "quick" ? "Quick request" : "Detailed request"}</Item>
            <Item k="Incident">{CATEGORY_LABEL[r.category]}</Item>
            <Item k="Reported urgency"><UrgencyBadge u={r.urgency} /></Item>
            <Item k="People">{r.people}</Item>
            {r.name && <Item k="Requester">{r.name}</Item>}
            <Item k="Location" wide>
              {hasGps ? (
                <span className="font-mono text-xs">{r.location.lat!.toFixed(3)}, {r.location.lng!.toFixed(3)} <span className="text-muted-foreground">(rounded)</span></span>
              ) : (
                <span>{r.location.text ?? "Not provided"} <span className="text-xs text-muted-foreground">· manual</span></span>
              )}
            </Item>
          </dl>
          <div className="rounded-lg border bg-panel p-4 text-center sm:w-44">
            <p className="font-mono text-[10px] tracking-widest text-monitor">SIMULATED ETA</p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums">{r.etaMinutes}<span className="text-base text-muted-foreground"> min</span></p>
            {r.etaFallback && <p className="mt-1 text-[11px] text-monitor">Fallback estimate</p>}
          </div>
        </div>

        {hasGps && (
          <div className="px-6 pb-2">
            <iframe
              title="Approximate location preview"
              className="h-48 w-full rounded-md border"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${r.location.lng! - 0.01},${r.location.lat! - 0.006},${r.location.lng! + 0.01},${r.location.lat! + 0.006}&layer=mapnik&marker=${r.location.lat},${r.location.lng}`}
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" /> Map © OpenStreetMap contributors</p>
          </div>
        )}

        <details className="border-t px-6 py-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">How was this estimate made?</summary>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {eta.steps.map((s) => (
              <li key={s.label} className="flex justify-between gap-4"><span className="text-muted-foreground">{s.label}</span><span>{s.delta >= 0 ? "+" : ""}{s.delta} min</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{ETA_DISCLAIMER}</p>
        </details>

        <div className="flex flex-wrap gap-2 border-t px-6 py-4">
          <Button asChild><Link to="/requests" search={{ open: r.id }}><ClipboardList /> View in dashboard</Link></Button>
          <Button asChild variant="ghost"><Link to="/">New request</Link></Button>
        </div>
      </div>
    </div>
  );
}

function Item({ k, children, wide }: { k: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="eyebrow">{k}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
