/** Simple Dijkstra over a small fictional road graph. Not real-world routing. */
import type { Edge, Hazard } from "./types";

export const HAZARD_SLOW_FACTOR = 2.5;

export const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export interface RouteResult {
  path: string[];
  km: number;
  minutes: number;
  hazardsEncountered: string[];
}

export interface RouteOptions {
  hazards: Hazard[];
  speedKmh: number;
  removed?: Set<string>;
}

export function shortestPath(edges: Edge[], from: string, to: string, opts: RouteOptions): RouteResult | null {
  const hz = new Map<string, Hazard>();
  for (const h of opts.hazards) if (h.active) hz.set(edgeKey(h.edge[0], h.edge[1]), h);

  const adj = new Map<string, { to: string; km: number; cost: number; hazard?: string }[]>();
  for (const [a, b, km] of edges) {
    const k = edgeKey(a, b);
    if (opts.removed?.has(k)) continue;
    const h = hz.get(k);
    if (h?.severity === "blocked") continue;
    const cost = (km / opts.speedKmh) * 60 * (h?.severity === "slow" ? HAZARD_SLOW_FACTOR : 1);
    const e = { km, cost, hazard: h?.id };
    adj.set(a, [...(adj.get(a) ?? []), { to: b, ...e }]);
    adj.set(b, [...(adj.get(b) ?? []), { to: a, ...e }]);
  }

  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { node: string; km: number; hazard?: string }>();
  const done = new Set<string>();
  while (true) {
    let cur: string | null = null;
    let best = Infinity;
    for (const [n, d] of dist) if (!done.has(n) && d < best) { best = d; cur = n; }
    if (cur === null) return null;
    if (cur === to) break;
    done.add(cur);
    for (const e of adj.get(cur) ?? []) {
      const nd = best + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { node: cur, km: e.km, hazard: e.hazard });
      }
    }
  }

  const path = [to];
  let km = 0;
  const hazards: string[] = [];
  let n = to;
  while (n !== from) {
    const p = prev.get(n)!;
    km += p.km;
    if (p.hazard) hazards.push(p.hazard);
    path.unshift(p.node);
    n = p.node;
  }
  return { path, km: Math.round(km * 10) / 10, minutes: Math.round(dist.get(to)!), hazardsEncountered: hazards };
}

/** Best alternative: shortest path that avoids at least one edge of the primary route. */
export function alternativePath(edges: Edge[], primary: RouteResult, opts: RouteOptions): RouteResult | null {
  let best: RouteResult | null = null;
  for (let i = 0; i < primary.path.length - 1; i++) {
    const removed = new Set(opts.removed);
    removed.add(edgeKey(primary.path[i], primary.path[i + 1]));
    const r = shortestPath(edges, primary.path[0], primary.path[primary.path.length - 1], { ...opts, removed });
    if (r && r.path.join() !== primary.path.join() && (!best || r.minutes < best.minutes)) best = r;
  }
  return best;
}

/** Hazards sitting on edges of the unhindered shortest path that the hazard-aware route avoided. */
export function hazardsAvoided(edges: Edge[], route: RouteResult, opts: RouteOptions): string[] {
  const naive = shortestPath(edges, route.path[0], route.path[route.path.length - 1], { ...opts, hazards: [] });
  if (!naive) return [];
  const used = new Set(route.path.slice(1).map((n, i) => edgeKey(route.path[i], n)));
  return opts.hazards
    .filter((h) => h.active)
    .filter((h) => {
      const k = edgeKey(h.edge[0], h.edge[1]);
      return naive.path.slice(1).some((n, i) => edgeKey(naive.path[i], n) === k) && !used.has(k);
    })
    .map((h) => h.id);
}
