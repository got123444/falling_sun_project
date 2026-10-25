import { EDGES, NODES, getNode } from "@/lib/sim/data";
import { edgeKey, type RouteResult } from "@/lib/sim/routing";
import { assessPriority } from "@/lib/sim/triage";
import type { World } from "@/lib/sim/types";

const COLOR = { urgent: "var(--urgent)", monitor: "var(--monitor)", routine: "var(--routine)" };
const LABEL_OFFSETS: Record<string, { x: number; y: number; anchor?: "start" | "end" }> = {
  N1: { x: 0, y: -18 },
  N2: { x: 0, y: -18 },
  N3: { x: 0, y: -18 },
  N4: { x: 18, y: 3, anchor: "start" },
  N5: { x: 0, y: 22 },
  N6: { x: 0, y: 25 },
  N7: { x: 24, y: 2, anchor: "start" },
  N8: { x: 18, y: 14, anchor: "start" },
  N9: { x: 0, y: -18 },
  N10: { x: 0, y: 23 },
  N11: { x: -18, y: 2, anchor: "end" },
  N12: { x: 0, y: 24 },
  N13: { x: 0, y: 23 },
};

export function SchematicMap({ world, selected, onSelect, route, alt }: { world: World; selected?: string; onSelect?: (id: string) => void; route?: RouteResult | null; alt?: RouteResult | null }) {
  const hz = new Map(world.hazards.filter((h) => h.active).map((h) => [edgeKey(h.edge[0], h.edge[1]), h]));
  const line = (r: RouteResult) => r.path.map((n) => `${getNode(n).x},${getNode(n).y}`).join(" ");

  return (
    <svg viewBox="0 0 1000 640" className="h-auto w-full rounded-lg bg-[#edf1e8]" role="img" aria-label="Illustrated Delhi NCR reference map with simulated patients, facilities, hazards, and routes">
      <rect width="1000" height="640" fill="#edf1e8" />
      <path d="M25 78 176 45 284 91 263 191 145 220 44 175Z" fill="#dce9d4" />
      <path d="M83 476 215 447 285 510 248 610 112 616 50 556Z" fill="#dce9d4" />
      <path d="M444 420 518 407 552 446 532 491 456 488 425 458Z" fill="#dce9d4" />
      <path d="M721 92C682 155 733 205 703 263S690 346 729 399 714 508 764 620" fill="none" stroke="#b7d6d5" strokeWidth="34" />
      <path d="M721 92C682 155 733 205 703 263S690 346 729 399 714 508 764 620" fill="none" stroke="#84b9bf" strokeWidth="2" />

      <g fill="none" stroke="#fffdf8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M75 332C190 300 290 318 392 358S586 422 700 457 834 508 940 548" strokeWidth="15" />
        <path d="M150 187C278 214 353 255 434 300S581 358 687 368 834 367 944 391" strokeWidth="13" />
        <path d="M235 582C330 492 405 413 471 328S569 203 654 145" strokeWidth="13" />
        <path d="M410 110C438 205 464 275 525 334S618 439 661 548" strokeWidth="12" />
        <path d="M84 410C249 354 395 342 547 369S780 434 909 465" strokeWidth="11" />
        <path d="M304 130C344 236 345 317 333 406S346 519 390 604" strokeWidth="10" />
        <path d="M524 152C607 218 647 279 645 354S640 481 694 562" strokeWidth="10" />
      </g>
      <g fill="none" stroke="#d3d4ca" strokeLinecap="round" strokeLinejoin="round">
        <path d="M75 332C190 300 290 318 392 358S586 422 700 457 834 508 940 548" strokeWidth="7" />
        <path d="M150 187C278 214 353 255 434 300S581 358 687 368 834 367 944 391" strokeWidth="6" />
        <path d="M235 582C330 492 405 413 471 328S569 203 654 145" strokeWidth="6" />
        <path d="M410 110C438 205 464 275 525 334S618 439 661 548" strokeWidth="5" />
        <path d="M84 410C249 354 395 342 547 369S780 434 909 465" strokeWidth="5" />
        <path d="M304 130C344 236 345 317 333 406S346 519 390 604" strokeWidth="4" />
        <path d="M524 152C607 218 647 279 645 354S640 481 694 562" strokeWidth="4" />
      </g>

      <g fill="#91a08c" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.5">
        <text x="96" y="286">ROHINI</text>
        <text x="123" y="393">WEST DELHI</text>
        <text x="430" y="267">CENTRAL DELHI</text>
        <text x="807" y="342">EAST DELHI</text>
        <text x="813" y="527">NOIDA</text>
        <text x="405" y="604">GURUGRAM</text>
        <text x="770" y="557" transform="rotate(75 770 557)">YAMUNA</text>
      </g>
      <g fill="#748277" fontSize="10" fontFamily="var(--font-mono)">
        <text x="130" y="318" transform="rotate(-7 130 318)">OUTER RING ROAD</text>
        <text x="727" y="390" transform="rotate(3 727 390)">VIKAS MARG</text>
        <text x="280" y="487" transform="rotate(-42 280 487)">NH 48</text>
      </g>

      {EDGES.map(([a, b]) => {
        const A = getNode(a), B = getNode(b), h = hz.get(edgeKey(a, b));
        return <line key={a + b} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={h ? (h.severity === "blocked" ? "var(--urgent)" : "var(--monitor)") : "#60766b"} strokeWidth={h ? 3 : 2} strokeDasharray={h ? "8 6" : undefined} strokeLinecap="round" opacity={h ? 0.95 : 0.52} />;
      })}
      {alt && <polyline points={line(alt)} fill="none" stroke="var(--monitor)" strokeWidth="4" strokeDasharray="5 7" opacity="0.9" />}
      {route && <polyline points={line(route)} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
      {world.hazards.filter((h) => h.active).map((h) => {
        const A = getNode(h.edge[0]), B = getNode(h.edge[1]);
        const x = (A.x + B.x) / 2, y = (A.y + B.y) / 2;
        return <g key={h.id}><polygon points={`${x},${y - 12} ${x + 11},${y + 8} ${x - 11},${y + 8}`} fill={h.severity === "blocked" ? "var(--urgent)" : "var(--monitor)"} /><text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fffdf8">!</text></g>;
      })}

      {NODES.map((n) => {
        const offset = LABEL_OFFSETS[n.id] ?? { x: 0, y: -18 };
        return <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="4" fill="#fffdf8" stroke="#63786a" strokeWidth="2" />
          <text x={n.x + offset.x} y={n.y + offset.y} textAnchor={offset.anchor ?? "middle"} fontSize="11" fontWeight="700" fill="#34483c" stroke="#edf1e8" strokeWidth="4" paintOrder="stroke">{n.label}</text>
        </g>;
      })}
      {world.facilities.map((f) => {
        const n = getNode(f.node);
        return <g key={f.id}><rect x={n.x - 12} y={n.y - 12} width="24" height="24" rx="4" fill="var(--info)" stroke="#fffdf8" strokeWidth="2" /><path d={`M${n.x - 6} ${n.y}H${n.x + 6}M${n.x} ${n.y - 6}V${n.y + 6}`} stroke="#fffdf8" strokeWidth="3" /></g>;
      })}
      {world.patients.filter((p) => p.status !== "evacuated").map((p) => {
        const c = assessPriority(p.vitals).category;
        const isSelected = selected === p.id;
        return (
          <g key={p.id} onClick={() => onSelect?.(p.id)} className={onSelect ? "cursor-pointer" : ""} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Select patient ${p.id}` : undefined} onKeyDown={onSelect ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(p.id); } } : undefined}>
            {isSelected && <circle cx={p.x} cy={p.y} r="15" fill="none" stroke="#263b30" strokeWidth="2" />}
            <circle cx={p.x} cy={p.y} r={isSelected ? 9 : 7} fill={COLOR[c]} stroke="#fffdf8" strokeWidth="2" opacity={p.status === "in_transit" ? 0.55 : 1}><title>{p.id}</title></circle>
          </g>
        );
      })}
      <g transform="translate(950 70)">
        <path d="M0 25V0M0 0-7 12M0 0 7 12" fill="none" stroke="#516455" strokeWidth="2" />
        <text x="0" y="40" textAnchor="middle" fontSize="10" fontWeight="700" fill="#516455">N</text>
      </g>
      <text x="18" y="623" fontSize="11" fill="#657568" fontFamily="var(--font-mono)">DELHI NCR · APPROXIMATE REFERENCE MAP · SIMULATED ROUTES</text>
    </svg>
  );
}