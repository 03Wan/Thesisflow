import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { guardVerifiedCitations, literatureContextPreview, validateCardGrounding } from "@/services/literatureQuality";
import type { LiteratureChunk } from "@/types/literature";

const fulltext = readFileSync("src/test/fixtures/literature/grounding-methods.txt", "utf8");
const sections = fulltext.split(/\n\n+/).slice(1);
const chunks: LiteratureChunk[] = sections.map((text, index) => ({ id: `lit-a-c${index + 1}`, literatureId: "lit-a", projectFileId: "file-a", documentParseId: "parse-a", chunkOrder: index, text, textHash: `hash-${index + 1}`, tokenEstimate: Math.ceil(text.length / 4), headingPath: text.split("\n")[0], locatorJson: JSON.stringify({ format: "pdf", pageNumber: index + 1, blockIndex: 0 }), createdAt: "2026-08-24T00:00:00.000Z" }));
const field = (value: string, evidence_refs: string[], status: "supported" | "partially_supported" | "not_found" | "ambiguous" = "supported") => ({ value, evidence_refs, confidence: status === "not_found" ? 1 : .85, status });

describe("Phase 5 card grounding evaluation", () => {
  it("reports a grounded fixture card with resolvable locators", () => {
    const payload = {
      research_question: field("Whether digital capability improves product innovation", ["lit-a-c1"]),
      sample: field("428 manufacturing firms", ["lit-a-c2"]),
      time_period: field("2018–2022", ["lit-a-c2"]),
      method: field("fixed-effects panel model", ["lit-a-c2"]),
      main_findings: [field("Digital capability is positively associated with product innovation", ["lit-a-c3"])],
      limitations: [field("single-country sample limits external validity", ["lit-a-c4"])],
      geography: field("无法从当前全文确认", [], "not_found"),
    };
    const result = validateCardGrounding(payload, chunks, "lit-a");
    expect(result.valid).toBe(true);
    expect(result.metrics).toEqual({ evidenceCoverage: 1, invalidRefRate: 0, unsupportedClaimRate: 0, notFoundCorrectness: 1 });
    expect(chunks.every((chunk) => JSON.parse(chunk.locatorJson).pageNumber > 0)).toBe(true);
    expect(literatureContextPreview(chunks).sources.every((source) => source.excerpt.length <= 240)).toBe(true);
  });

  it("detects foreign, missing and malformed source references", () => {
    const foreign = { ...chunks[0], id: "project-b-c1", literatureId: "lit-b", projectFileId: "file-b" };
    const payload = {
      method: field("fixed-effects panel model", ["lit-a-c2"]),
      sample: field("invented sample", ["missing-source"]),
      contributions: field("foreign project claim", ["project-b-c1"]),
      geography: field("not found", ["lit-a-c1"], "not_found"),
    };
    const result = validateCardGrounding(payload, [...chunks, foreign], "lit-a");
    expect(result.valid).toBe(false);
    expect(result.invalidRefs).toEqual(expect.arrayContaining(["missing-source", "project-b-c1"]));
    expect(result.metrics.invalidRefRate).toBeGreaterThan(0);
    expect(result.metrics.unsupportedClaimRate).toBeGreaterThan(0);
    expect(result.metrics.notFoundCorrectness).toBe(0);
  });

  it("does not display a supported claim without evidence", () => {
    const result = validateCardGrounding({ variables: field("digital capability", [], "supported") }, chunks, "lit-a");
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toContain("no evidence");
  });

  it("rejects a DOI or source id outside the current library/context", () => {
    const payload = { citation_summary: field("Claim cites DOI 10.9999/invented", ["lit-a-c1"]) };
    expect(guardVerifiedCitations(payload, chunks.map((chunk) => chunk.id), ["10.1000/real"])).toMatchObject({ valid: false, invalidDois: ["10.9999/invented"] });
    expect(guardVerifiedCitations({ method: field("x", ["foreign-source"]) }, chunks.map((chunk) => chunk.id), [])).toMatchObject({ valid: false, invalidSourceRefs: ["foreign-source"] });
  });
});
