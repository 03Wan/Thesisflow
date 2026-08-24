import { describe, expect, it } from "vitest";
import { buildMergePlan, type ImportedMetadata } from "@/services/literatureImportPipeline";
import { classifyMetadataMatch, titleSimilarity } from "@/services/literatureQuality";

const metadata = (changes: Partial<ImportedMetadata>): ImportedMetadata => ({ raw: "fixture", sourceType: "manual", ...changes });

describe("Phase 5 metadata quality gate", () => {
  it.each([
    ["raw DOI", metadata({ doi: "10.1000/ABC" }), metadata({ doi: "10.1000/abc" }), "exact_identifier", true],
    ["DOI URL", metadata({ doi: "https://doi.org/10.1000/ABC" }), metadata({ doi: "doi:10.1000/abc" }), "exact_identifier", true],
    ["same title different year", metadata({ title: "Shared study", year: 2022, authors: ["Li, A"] }), metadata({ title: "Shared study", year: 2024, authors: ["Li, A"] }), "possible", false],
    ["same title different author", metadata({ title: "Shared study", year: 2024, authors: ["Li, A"] }), metadata({ title: "Shared study", year: 2024, authors: ["Wang, B"] }), "possible", false],
    ["conference vs journal", metadata({ title: "Shared study", year: 2024, authors: ["Li, A"], type: "conference-paper" }), metadata({ title: "Shared study", year: 2024, authors: ["Li, A"], type: "journal-article" }), "related_version", false],
    ["preprint vs published", metadata({ title: "Shared study", year: 2024, authors: ["Li, A"], type: "preprint" }), metadata({ title: "Shared study", year: 2024, authors: ["Li, A"], type: "journal-article" }), "related_version", false],
    ["provider DOI conflict", metadata({ title: "Shared study", doi: "10.1000/a", sourceType: "crossref" }), metadata({ title: "Shared study", doi: "10.1000/b", sourceType: "openalex" }), "separate", false],
    ["Chinese/English translation", metadata({ title: "数字能力与企业创新", year: 2024, authors: ["Li, A"] }), metadata({ title: "Digital capability and firm innovation", year: 2024, authors: ["Li, A"] }), "separate", false],
  ])("classifies %s without weak false merges", (_name, left, right, kind, autoMerge) => {
    expect(classifyMetadataMatch(left as ImportedMetadata, right as ImportedMetadata)).toMatchObject({ kind, autoMerge });
  });

  it("keeps spelling variants review-only", () => {
    const left = metadata({ title: "Digital capability and innovation performance", year: 2024, authors: ["Chen, Li"] });
    const right = metadata({ title: "Digital capabilities and innovation performance", year: 2024, authors: ["Chen, Li"] });
    expect(titleSimilarity(left.title, right.title)).toBeGreaterThan(0.90);
    expect(classifyMetadataMatch(left, right)).toMatchObject({ kind: "possible", autoMerge: false });
  });

  it("allows only the full exact metadata tuple to be a strong auto-link", () => {
    const left = metadata({ title: "Exact work", year: 2024, authors: ["Chen, Li"], type: "journal-article" });
    const right = metadata({ title: "Exact work.", year: 2024, authors: ["Chen, Li"], type: "journal-article" });
    expect(classifyMetadataMatch(left, right)).toMatchObject({ kind: "strong_metadata", autoMerge: true });
  });

  it("retains provenance and a complete undo snapshot after merge planning", () => {
    const plan = buildMergePlan("canonical", "duplicate", { notes: ["n1"], tags: ["t1"], files: ["f1"], cards: ["c1"], provenance: ["user:title"] }, { notes: ["n2"], tags: ["t2"], files: ["f2"], cards: ["c2"], provenance: ["crossref:title", "openalex:year"] });
    expect(plan.merged.provenance).toEqual(["user:title", "crossref:title", "openalex:year"]);
    expect(plan.undoSnapshot).toMatchObject({ primary: { provenance: ["user:title"] }, duplicate: { provenance: ["crossref:title", "openalex:year"] } });
  });
});
