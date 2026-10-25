import { describe, expect, it } from "vitest";
import { EDGES, initialHazards } from "@/lib/sim/data";
import { estimateEta } from "@/lib/sim/eta";
import { shortestPath } from "@/lib/sim/routing";
import { assessPriority } from "@/lib/sim/triage";

describe("demo triage", () => {
  it("flags SpO2 below 90 plus low BP as urgent", () => {
    expect(assessPriority({ hr: 80, spo2: 85, rr: 16, sbp: 85 }).category).toBe("urgent");
  });
  it("normal values are routine", () => {
    expect(assessPriority({ hr: 80, spo2: 98, rr: 16, sbp: 120 }).category).toBe("routine");
  });
  it("missing value is never routine", () => {
    expect(assessPriority({ hr: 80, spo2: null, rr: 16, sbp: 120 }).category).toBe("monitor");
  });
});

describe("eta", () => {
  it("is stable for the same id", () => {
    const i = { id: "MV-ABC", category: "medical" as const, urgency: "high" as const, hasCoordinates: true };
    expect(estimateEta(i).minutes).toBe(estimateEta(i).minutes);
  });
  it("adds fallback penalty without coordinates", () => {
    const i = { id: "MV-ABC", category: "medical" as const, urgency: "high" as const };
    expect(estimateEta({ ...i, hasCoordinates: false }).minutes - estimateEta({ ...i, hasCoordinates: true }).minutes).toBe(6);
  });
});

describe("routing", () => {
  it("never uses a blocked edge", () => {
    const r = shortestPath(EDGES, "N7", "N12", { hazards: initialHazards(), speedKmh: 40 })!;
    expect(r.path).not.toEqual(["N7", "N12"]);
  });
});
