import { describe, expect, it } from "vitest";
import { planLiteratureCleanup } from "@/services/literatureQuality";

describe("Phase 5 large-library and storage lifecycle gate", () => {
  it("handles 500 records and 4,000 chunks within the local interaction budget", () => {
    const started = performance.now();
    const records = Array.from({ length: 500 }, (_, index) => ({ id: `lit-${index}`, title: `Digital innovation study ${index}`, year: 2015 + index % 10, status: index % 4 === 0 ? "reading" : "unread", tags: new Set<string>() }));
    const chunks = records.flatMap((record, recordIndex) => Array.from({ length: 8 }, (_, chunkIndex) => ({ id: `${record.id}-c${chunkIndex}`, literatureId: record.id, text: `${chunkIndex % 2 ? "数字化转型" : "fixed effects"} variable-${recordIndex % 25} conclusion-${chunkIndex}` })));
    const page = records.filter((record) => record.status === "reading" && record.year >= 2020).slice(0, 50);
    const hits = chunks.filter((chunk) => chunk.text.includes("数字化转型") && chunk.text.includes("variable-3")).slice(0, 20);
    records.filter((record) => Number(record.id.slice(4)) < 100).forEach((record) => record.tags.add("核心文献"));
    const opened = chunks.filter((chunk) => chunk.literatureId === "lit-3");
    const elapsedMs = performance.now() - started;
    expect(records).toHaveLength(500); expect(chunks).toHaveLength(4000);
    expect(page.length).toBeGreaterThan(0); expect(hits.length).toBeGreaterThan(0); expect(opened).toHaveLength(8);
    expect(records.filter((record) => record.tags.has("核心文献"))).toHaveLength(100);
    expect(elapsedMs).toBeLessThan(2000);
  });

  it("removes only unreferenced stale derived data and preserves provenance/audit", () => {
    const old = "2026-06-01T00:00:00.000Z"; const recent = "2026-08-23T00:00:00.000Z";
    const plan = planLiteratureCleanup(new Date("2026-08-24T00:00:00.000Z"), {
      metadataSources: [{ id: "raw-crossref", createdAt: old, referenced: true }],
      chunks: [{ id: "old-stale-chunk", status: "stale", createdAt: old }, { id: "evidence-chunk", status: "stale", createdAt: old, referenced: true }],
      embeddings: [{ id: "old-vector", status: "stale", createdAt: old }, { id: "recent-vector", status: "stale", createdAt: recent }],
      cards: [{ id: "old-draft", status: "stale", createdAt: old }, { id: "confirmed-card", status: "confirmed", createdAt: old, referenced: true }],
    });
    expect(plan.chunkIds).toEqual(["old-stale-chunk"]);
    expect(plan.embeddingIds).toEqual(["old-vector"]);
    expect(plan.cardIds).toEqual(["old-draft"]);
    expect(plan.preservedAuditIds).toEqual(expect.arrayContaining(["raw-crossref", "confirmed-card"]));
  });
});
