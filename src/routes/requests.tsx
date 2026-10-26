import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, RequestStatusBadge, SimLabel, UrgencyBadge } from "@/components/med/bits";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_LABEL, STATUS_LABEL, type RequestStatus } from "@/lib/sim/types";

export const Route = createFileRoute("/requests")({
  validateSearch: (s: Record<string, unknown>): { open?: string } => ({
    open: typeof s.open === "string" ? s.open : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Requests — MEDIVAC Command" },
      { name: "description", content: "Every simulated help request, its ETA and status." },
      { property: "og:title", content: "Requests — MEDIVAC Command" },
      { property: "og:description", content: "Track simulated help requests across Delhi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Requests,
});

const STATUSES: RequestStatus[] = ["created", "awaiting", "assigned", "completed"];

function Requests() {
  const { open } = Route.useSearch();
  const { requests, requestsLoaded, updateRequestStatus, clearRequests } = useSim();

  return (
    <div className="fade-up">
      <PageHeader
        title="Requests"
        sub="Help requests made from this browser. Move each one along as a dispatcher would."
        actions={<>
          <SimLabel />
          {requests.length > 0 && <Button variant="ghost" size="sm" onClick={clearRequests}>Clear all</Button>}
          <Button asChild size="sm"><Link to="/">New request</Link></Button>
        </>}
      />
      {!requestsLoaded ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <Empty title="No requests yet" body="Send a quick or detailed request and it shows up here." action={<Button asChild><Link to="/">Ask for help</Link></Button>} />
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className={`panel flex flex-wrap items-center gap-4 p-4 ${open === r.id ? "ring-2 ring-primary" : ""}`}>
              <div className="min-w-40">
                <Link to="/request/$id" params={{ id: r.id }} className="font-mono font-semibold hover:underline">{r.id}</Link>
                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex-1 text-sm">
                <p>{CATEGORY_LABEL[r.category]} · {r.people} {r.people === 1 ? "person" : "people"}</p>
                <p className="text-xs text-muted-foreground">{r.location.kind === "gps" ? "Shared location" : r.location.text ?? "No location"}</p>
              </div>
              <UrgencyBadge u={r.urgency} />
              <span className="font-mono text-sm tabular-nums">{r.etaMinutes} min</span>
              <RequestStatusBadge s={r.status} />
              <select
                aria-label={`Status for ${r.id}`}
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={r.status}
                onChange={(e) => updateRequestStatus(r.id, e.target.value as RequestStatus)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
