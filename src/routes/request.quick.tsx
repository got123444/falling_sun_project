import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildRequest, getBrowserLocation, GEO_MESSAGE, makeRequestId } from "@/lib/sim/requests";
import { useSim } from "@/lib/sim/store";

export const Route = createFileRoute("/request/quick")({
  head: () => ({
    meta: [
      { title: "Quick request — MEDIVAC Command (demo)" },
      { name: "description", content: "One-tap simulated assistance request using your location, with a simulated ETA." },
      { property: "og:title", content: "Quick request — MEDIVAC Command" },
      { property: "og:description", content: "One tap. Simulated dispatch estimate. No real emergency services contacted." },
    ],
  }),
  component: Quick,
});

type Phase = "idle" | "locating" | "creating" | "fallback";

function Quick() {
  const { addRequest } = useSim();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [geoMsg, setGeoMsg] = useState("");
  const [manual, setManual] = useState("");
  const [manualErr, setManualErr] = useState("");
  const [denied, setDenied] = useState(false);

  const create = (loc: Parameters<typeof buildRequest>[0]["location"]) => {
    setPhase("creating");
    const id = makeRequestId(Date.now(), Math.random());
    const req = buildRequest({ id, mode: "quick", createdAt: new Date().toISOString(), category: "medical", urgency: "high", people: 1, location: loc });
    window.setTimeout(() => {
      addRequest(req);
      navigate({ to: "/request/$id", params: { id } });
    }, 700);
  };

  const start = async () => {
    if (phase !== "idle" && phase !== "fallback") return;
    if (denied) return; // never re-prompt after a denial
    setPhase("locating");
    const r = await getBrowserLocation();
    if (r.ok) return create({ kind: "gps", lat: r.lat, lng: r.lng, accuracy: r.accuracy });
    if (r.reason === "denied") setDenied(true);
    setGeoMsg(GEO_MESSAGE[r.reason]);
    setPhase("fallback");
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "creating") return;
    if (manual.trim().length < 3) return setManualErr("A few words is enough — a street, landmark or building.");
    setManualErr("");
    create({ kind: "manual", text: manual.trim().slice(0, 160) });
  };

  const busy = phase === "locating" || phase === "creating";

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cancel and go back
      </Link>

      <div className="panel mt-4 p-6 text-center sm:p-10 fade-up">
        <p className="eyebrow text-urgent">Quick request</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tap once. We'll take it from there.</h1>

        <Button
          variant="urgent"
          size="xl"
          className="mt-8 w-full"
          onClick={start}
          disabled={busy || denied}
          aria-describedby="quick-note"
        >
          {phase === "locating" ? (
            <><Loader2 className="animate-spin" /> Finding your location…</>
          ) : phase === "creating" ? (
            <><Loader2 className="animate-spin" /> Creating simulated request…</>
          ) : (
            "REQUEST ASSISTANCE"
          )}
        </Button>
        <p id="quick-note" className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Uses your location only after permission is granted. This demonstration generates a simulated dispatch estimate and does not contact emergency services.
        </p>
        {denied && phase !== "creating" && (
          <p className="mt-2 text-xs text-muted-foreground">We won't ask for location again. Use the field below instead.</p>
        )}
      </div>

      {phase === "fallback" || (phase === "creating" && manual) ? (
        <form onSubmit={submitManual} className="panel mt-4 p-5 fade-up" noValidate>
          <p className="flex items-start gap-2 text-sm text-monitor">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {geoMsg}
          </p>
          <Label htmlFor="manual" className="mt-4 block">Where are you?</Label>
          <Input
            id="manual"
            className="mt-1.5"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. Market Cross, by the clock tower"
            aria-invalid={!!manualErr}
            aria-describedby={manualErr ? "manual-err" : undefined}
            autoFocus
          />
          {manualErr && <p id="manual-err" className="mt-1.5 text-xs text-urgent">{manualErr}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {phase === "creating" ? <><Loader2 className="animate-spin" /> Creating…</> : "Send with this location"}
            </Button>
            {!denied && (
              <Button type="button" variant="ghost" onClick={start} disabled={busy}>Try location again</Button>
            )}
          </div>
        </form>
      ) : null}
    </div>
  );
}
