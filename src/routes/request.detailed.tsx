import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, LocateFixed } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildRequest, getBrowserLocation, GEO_MESSAGE, makeRequestId, validateDetailed, type DetailedForm, type FormErrors } from "@/lib/sim/requests";
import { useSim } from "@/lib/sim/store";
import { CATEGORY_LABEL, type IncidentCategory, type Urgency } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/request/detailed")({
  head: () => ({
    meta: [
      { title: "Detailed request — MEDIVAC Command (demo)" },
      { name: "description", content: "Describe the incident, people involved and your location to create a simulated assistance request." },
      { property: "og:title", content: "Detailed request — MEDIVAC Command" },
      { property: "og:description", content: "A short, accessible form that creates a simulated request with an ETA." },
    ],
  }),
  component: Detailed,
});

const URGENCIES: { v: Urgency; label: string; hint: string; tone: string }[] = [
  { v: "critical", label: "Critical", hint: "Someone may not survive without help", tone: "peer-checked:border-urgent peer-checked:bg-urgent/10" },
  { v: "high", label: "High", hint: "Serious, getting worse", tone: "peer-checked:border-monitor peer-checked:bg-monitor/10" },
  { v: "moderate", label: "Moderate", hint: "Needs help, currently stable", tone: "peer-checked:border-info peer-checked:bg-info/10" },
  { v: "low", label: "Low", hint: "Not time-critical", tone: "peer-checked:border-primary peer-checked:bg-primary/10" },
];

const empty: DetailedForm = { name: "", contact: "", category: "", people: "1", description: "", urgency: "", locationText: "", coords: null };

function Detailed() {
  const { addRequest } = useSim();
  const navigate = useNavigate();
  const [f, setF] = useState<DetailedForm>(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [geo, setGeo] = useState<{ state: "idle" | "loading" | "done" | "error"; msg?: string; denied?: boolean }>({ state: "idle" });
  const lock = useRef(false);

  const set = <K extends keyof DetailedForm>(k: K, v: DetailedForm[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k] || (k === "locationText" && errors.location)) setErrors((e) => ({ ...e, [k]: undefined, ...(k === "locationText" ? { location: undefined } : {}) }));
  };

  const locate = async () => {
    if (geo.denied || geo.state === "loading") return;
    setGeo({ state: "loading" });
    const r = await getBrowserLocation();
    if (r.ok) {
      set("coords", { lat: r.lat, lng: r.lng, accuracy: r.accuracy });
      setErrors((e) => ({ ...e, location: undefined }));
      setGeo({ state: "done" });
    } else setGeo({ state: "error", msg: GEO_MESSAGE[r.reason], denied: r.reason === "denied" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    const errs = validateDetailed(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    lock.current = true;
    setSubmitting(true);
    const id = makeRequestId(Date.now(), Math.random());
    const req = buildRequest({
      id,
      mode: "detailed",
      createdAt: new Date().toISOString(),
      name: f.name.trim(),
      contact: f.contact.trim() || undefined,
      category: f.category as IncidentCategory,
      urgency: f.urgency as Urgency,
      people: Number(f.people),
      description: f.description.trim() || undefined,
      location: f.coords
        ? { kind: "gps", lat: f.coords.lat, lng: f.coords.lng, accuracy: f.coords.accuracy, text: f.locationText.trim() || undefined }
        : { kind: "manual", text: f.locationText.trim() },
    });
    window.setTimeout(() => {
      addRequest(req);
      navigate({ to: "/request/$id", params: { id } });
    }, 900);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Tell us what's happening</h1>
      <p className="mt-1 text-sm text-muted-foreground">Only your name, the incident type, urgency and a location are required.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <Section n={1} title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Your name" error={errors.name} required>
              <Input id="field-name" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
            </Field>
            <Field id="contact" label="Contact number" hint="Optional in this demo" error={errors.contact}>
              <Input id="field-contact" type="tel" autoComplete="tel" value={f.contact} onChange={(e) => set("contact", e.target.value)} aria-invalid={!!errors.contact} />
            </Field>
          </div>
        </Section>

        <Section n={2} title="What happened">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field id="category" label="Incident type" error={errors.category} required>
              <select
                id="field-category"
                value={f.category}
                onChange={(e) => set("category", e.target.value as IncidentCategory)}
                aria-invalid={!!errors.category}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" className="bg-popover">Choose one…</option>
                {(Object.keys(CATEGORY_LABEL) as IncidentCategory[]).map((k) => (
                  <option key={k} value={k} className="bg-popover">{CATEGORY_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <Field id="people" label="People needing help" error={errors.people} required>
              <Input id="field-people" type="number" inputMode="numeric" min={1} max={200} value={f.people} onChange={(e) => set("people", e.target.value)} aria-invalid={!!errors.people} />
            </Field>
          </div>
          <Field id="description" label="Brief description" hint={`${f.description.length}/500`} error={errors.description}>
            <Textarea id="field-description" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What you can see, any injuries, hazards nearby…" />
          </Field>

          <fieldset>
            <legend className="text-sm font-medium">How urgent does it feel? <span className="text-urgent">*</span></legend>
            <p className="mt-0.5 text-xs text-muted-foreground">Your own judgement — not a medical diagnosis.</p>
            <div id="field-urgency" tabIndex={-1} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {URGENCIES.map((u) => (
                <label key={u.v} className="relative cursor-pointer">
                  <input type="radio" name="urgency" value={u.v} checked={f.urgency === u.v} onChange={() => set("urgency", u.v)} className="peer sr-only" />
                  <span className={cn("block h-full rounded-md border p-3 transition-colors hover:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-ring", u.tone)}>
                    <span className="block text-sm font-medium">{u.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{u.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.urgency && <p className="mt-1.5 text-xs text-urgent">{errors.urgency}</p>}
          </fieldset>
        </Section>

        <Section n={3} title="Where are you">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={locate} disabled={geo.state === "loading" || geo.denied}>
              {geo.state === "loading" ? <Loader2 className="animate-spin" /> : geo.state === "done" ? <Check className="text-routine" /> : <LocateFixed />}
              {geo.state === "done" ? "Location shared" : geo.state === "loading" ? "Finding you…" : "Use my current location"}
            </Button>
            {f.coords && (
              <span className="font-mono text-xs text-muted-foreground">
                {f.coords.lat.toFixed(4)}, {f.coords.lng.toFixed(4)} {f.coords.accuracy ? `(±${f.coords.accuracy} m)` : ""}
                <button type="button" className="ml-2 text-primary hover:underline" onClick={() => { set("coords", null); setGeo({ state: "idle" }); }}>remove</button>
              </span>
            )}
          </div>
          {geo.state === "error" && <p className="text-xs text-monitor">{geo.msg}</p>}
          <Field id="locationText" label={f.coords ? "Landmark (optional)" : "Address or landmark"} error={errors.location}>
            <Input id="field-location" value={f.locationText} onChange={(e) => set("locationText", e.target.value)} placeholder="e.g. School Hill, north gate" aria-invalid={!!errors.location} />
          </Field>
        </Section>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <><Loader2 className="animate-spin" /> Creating simulated request…</> : "Create simulated request"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link to="/">Cancel</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Submitting creates a demo record in this browser only. No emergency service is contacted.</p>
      </form>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-secondary font-mono text-xs">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, required, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={`field-${id === "locationText" ? "location" : id}`}>
          {label} {required && <span className="text-urgent">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {error && <p role="alert" className="mt-1.5 text-xs text-urgent">{error}</p>}
    </div>
  );
}
