import { EDGES, NODES, getNode } from "@/lib/sim/data";
import { edgeKey, type RouteResult } from "@/lib/sim/routing";
import { assessPriority } from "@/lib/sim/triage";
import type { World } from "@/lib/sim/types";

const COLOR = { urgent: "var(--urgent)", monitor: "var(--monitor)", routine: "var(--routine)" };

export function SchematicMap({ world, selected, onSelect, route, alt }: { world: World; selected?: string; onSelect?: (id: string) => void; route?: RouteResult | null; alt?: RouteResult | null }) {
  const hz = new Map(world.hazards.filter((h) => h.active).map((h) => [edgeKey(h.edge[0], h.edge[1]), h]));
  const line = (r: RouteResult) => r.path.map((n) => `${getNode(n).x},${getNode(n).y}`).join(" ");
  return (
    <svg viewBox="0 0 1000 640" className="h-auto w-full rounded-lg bg-panel" role="img" aria-label="Schematic map of the fictional Kestrel Valley training area">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" /></pattern>
      </defs>
      <rect width="1000" height="640" fill="url(#grid)" />
      {EDGES.map(([a, b]) => {
        const A = getNode(a), B = getNode(b), h = hz.get(edgeKey(a, b));
        return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={h ? (h.severity === "blocked" ? "var(--urgent)" : "var(--monitor)") : "var(--input)"} strokeWidth={h ? 3 : 4} strokeDasharray={h ? "8 6" : undefined} strokeLinecap="round" />;
      })}
      {alt && <polyline points={line(alt)} fill="none" stroke="var(--monitor)" strokeWidth="3" strokeDasharray="4 6" opacity="0.8" />}
      {route && <polyline points={line(route)} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
      {world.hazards.filter((h) => h.active).map((h) => {
        const A = getNode(h.edge[0]), B = getNode(h.edge[1]);
        const x = (A.x + B.x) / 2, y = (A.y + B.y) / 2;
        return <g key={h.id}><polygon points={`${x},${y - 12} ${x + 11},${y + 8} ${x - 11},${y + 8}`} fill={h.severity === "blocked" ? "var(--urgent)" : "var(--monitor)"} /><text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--background)">!</text></g>;
      })}
      {NODES.map((n) => (
        <text key={n.id} x={n.x} y={n.y - 14} textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">{n.label}</text>
      ))}
      {world.facilities.map((f) => {
        const n = getNode(f.node);
        return <g key={f.id}><rect x={n.x - 13} y={n.y - 13} width="26" height="26" rx="5" fill="var(--info)" /><path d={`M${n.x - 6} ${n.y}H${n.x + 6}M${n.x} ${n.y - 6}V${n.y + 6}`} stroke="var(--background)" strokeWidth="3.5" /></g>;
      })}
      {world.patients.filter((p) => p.status !== "evacuated").map((p) => {
        const c = assessPriority(p.vitals).category;
        const s = selected === p.id;
        return (
          <g key={p.id} onClick={() => onSelect?.(p.id)} className={onSelect ? "cursor-pointer" : ""}>
            {s && <circle cx={p.x} cy={p.y} r="15" fill="none" stroke="var(--foreground)" strokeWidth="2" />}
            <circle cx={p.x} cy={p.y} r={s ? 9 : 7} fill={COLOR[c]} stroke="var(--background)" strokeWidth="2" opacity={p.status === "in_transit" ? 0.5 : 1}><title>{p.id}</title></circle>
          </g>
        );
      })}
      <text x="16" y="626" fontSize="12" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">FICTIONAL TRAINING AREA · KESTREL VALLEY · SIMULATED</text>
    </svg>
  );
}
