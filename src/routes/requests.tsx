import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, PageHeader, RequestStatusBadge, Stat, UrgencyBadge } from "@/components/med/bits";
import { ETA_DISCLAIMER } from "@/lib/sim/eta";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_LABEL, STATUS_LABEL, type IncidentCategory, type RequestStatus } from "@/lib/sim/types";

export const Route = createFileRoute("/requests")({
  validateSearch: (s: Record<string, unknown>): { open?: string } => (typeof s.open === "string" ? { open: s.open } : {}),
  head: () => ({
    meta: [
      { title: "Requests dashboard — MEDIVAC Command (demo)" },
      { name: "description", content: "All simulated assistance requests with status, urgency and simulated ETA." },
      { property: "og:title", content: "Requests dashboard — MEDIVAC Command" },
      { property: "og:description", content: "Track simulated assistance requests." },
    ],
  }),
  component: Requests,
});

const sel = "h-9 rounded-md border border-input bg-transparent px-2 text-sm";

function Requests() {
  const { requests, updateRequestStatus, clearRequests, requestsLoaded } = useSim();
  const { open } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [cat, setCat] = useState<IncidentCategory | "">("");

  const rows = useMemo(
    () =>
      requests.filter(
        (r) =>
          (!status || r.status === status) &&
          (!cat || r.category === cat) &&
          (!q || `${r.id} ${r.name ?? ""} ${r.location.text ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [requests, q, status, cat],
  );
  const sel_ = requests.find((r) => r.id === open);
  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length;

  return (
    <div>
      <PageHeader
        title="Requests"
        sub="Every simulated request made from this browser. Status changes here are demo-only."
        actions={
          <>
            <Button asChild><Link to="/"><Plus /> New request</Link></Button>
            {requests.length > 0 && (
              <Button variant="ghost" onClick={() => { if (confirm("Clear all demo requests from this browser?")) { clearRequests(); toast("Demo requests cleared"); } }}>
                <Trash2 /> Reset
              </Button>
            )}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total requests" value={requests.length} />
        <Stat label="Active" value={requests.length - count("completed")} accent="primary" />
        <Stat label="Awaiting assignment" value={count("created") + count("awaiting")} accent="monitor" />
        <Stat label="Completed" value={count("completed")} accent="routine" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search ID, name or place" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value as RequestStatus | "")} aria-label="Filter by status">
          <option value="" className="bg-popover">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k} className="bg-popover">{v}</option>)}
        </select>
        <select className={sel} value={cat} onChange={(e) => setCat(e.target.value as IncidentCategory | "")} aria-label="Filter by category">
          <option value="" className="bg-popover">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k} className="bg-popover">{v}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="panel overflow-x-auto">
          {!requestsLoaded ? null : rows.length === 0 ? (
            <div className="p-4"><Empty title={requests.length ? "No requests match these filters" : "No requests yet"} body={requests.length ? undefined : "Create one from the start page and it'll appear here instantly."} action={!requests.length && <Button asChild size="sm"><Link to="/">Make a request</Link></Button>} /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">{["ID", "Incident", "Urgency", "Location", "Created", "ETA", "Status"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => navigate({ search: { open: r.id } })} className={`cursor-pointer border-b last:border-0 hover:bg-secondary/60 ${open === r.id ? "bg-secondary" : ""}`}>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.id}</td>
                    <td className="px-3 py-2.5">{CATEGORY_LABEL[r.category]}</td>
                    <td className="px-3 py-2.5"><UrgencyBadge u={r.urgency} /></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.location.kind === "gps" ? "GPS shared" : "Manual"}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.etaMinutes}m</td>
                    <td className="px-3 py-2.5"><RequestStatusBadge s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="panel h-fit p-5">
          {!sel_ ? (
            <p className="text-sm text-muted-foreground">Select a request to see its details.</p>
          ) : (
            <div className="fade-up space-y-4">
              <div className="flex items-start justify-between">
                <div><p className="eyebrow">Request</p><p className="font-mono text-lg font-semibold">{sel_.id}</p></div>
                <Button size="icon" variant="ghost" aria-label="Close" onClick={() => navigate({ search: {} })}><X /></Button>
              </div>
              <dl className="space-y-2 text-sm">
                <Row k="Incident">{CATEGORY_LABEL[sel_.category]}</Row>
                <Row k="Urgency"><UrgencyBadge u={sel_.urgency} /></Row>
                <Row k="People">{sel_.people}</Row>
                {sel_.name && <Row k="Requester">{sel_.name}</Row>}
                <Row k="Location">{sel_.location.kind === "gps" ? `${sel_.location.lat?.toFixed(3)}, ${sel_.location.lng?.toFixed(3)}` : sel_.location.text}</Row>
                <Row k="Simulated ETA">{sel_.etaMinutes} min{sel_.etaFallback ? " (fallback)" : ""}</Row>
              </dl>
              {sel_.description && <p className="rounded-md bg-panel p-3 text-sm">{sel_.description}</p>}
              <div>
                <p className="eyebrow mb-2">Change status (demo only)</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((s) => (
                    <Button key={s} size="sm" variant={sel_.status === s ? "default" : "outline"} onClick={() => { updateRequestStatus(sel_.id, s); toast.success(`${sel_.id}: ${STATUS_LABEL[s]}`); }}>
                      {STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{ETA_DISCLAIMER}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{children}</dd></div>;
}
