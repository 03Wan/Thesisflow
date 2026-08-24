import { describe, expect, it } from "vitest";
import { buildCitationAsset, buildLiteratureMatrix, toCslJson } from "@/services/literatureResearchAssets";
import type { Author, Identifier, LiteratureCard, LiteratureCardEvidence, LiteratureItem } from "@/types/literature";

const item: LiteratureItem = {
  id: "lit-a", projectId: "project-a", title: "Evidence-first research", subtitle: null, abstract: null,
  year: 2026, publicationDate: null, venue: "Journal of Verification", volume: "4", issue: "2", pages: "10-22",
  publisher: "Example Press", language: "en", literatureType: "journal_article", status: "read",
  verificationStatus: "verified", preferredCitationKey: "smith2026", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z",
};
const authors: Author[] = [{ id: "author-a", givenName: "Ada", familyName: "Smith", literalName: null, orcid: null }];
const identifiers: Identifier[] = [
  { id: "doi-a", literatureId: "lit-a", scheme: "doi", value: "https://doi.org/10.1000/ABC", normalizedValue: "10.1000/abc", source: "crossref", verified: true },
  { id: "url-a", literatureId: "lit-a", scheme: "url", value: "https://example.test/work", normalizedValue: "https://example.test/work", source: "crossref", verified: true },
];

describe("Phase 5 research assets", () => {
  it("exports normalized CSL-JSON without inventing absent fields", () => {
    expect(toCslJson(item, authors, identifiers)).toEqual({
      id: "smith2026", type: "article-journal", title: "Evidence-first research",
      author: [{ given: "Ada", family: "Smith" }], issued: { "date-parts": [[2026]] },
      "container-title": "Journal of Verification", volume: "4", issue: "2", page: "10-22",
      publisher: "Example Press", language: "en", DOI: "10.1000/abc", URL: "https://example.test/work",
    });
  });

  it("builds a project-scoped citation asset", () => {
    const asset = buildCitationAsset("project-a", "2026-08-24T00:00:00.000Z", [{ item, authors, identifiers }]);
    expect(asset).toMatchObject({ schemaVersion: "csl-json.v1", projectId: "project-a", items: [{ id: "smith2026" }] });
    expect(() => buildCitationAsset("project-b", asset.generatedAt, [{ item, authors, identifiers }])).toThrow(/another project/);
  });

  it("projects card fields and evidence coverage into a literature matrix", () => {
    const cards: LiteratureCard[] = [
      { id: "card-old", literatureId: "lit-a", schemaVersion: "v1", status: "draft", aiRunId: null, summary: null, structuredJson: JSON.stringify({ method: { value: "OLS" } }), createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      { id: "card-new", literatureId: "lit-a", schemaVersion: "v1", status: "reviewed", aiRunId: null, summary: null, structuredJson: JSON.stringify({ method: { value: "TWFE" }, variables: [{ value: "x" }] }), createdAt: "2026-01-02", updatedAt: "2026-01-02" },
    ];
    const evidence: LiteratureCardEvidence[] = [
      { id: "ev-1", cardId: "card-new", fieldPath: "method", chunkId: "chunk-a", sourceLocatorJson: "{}", quoteHash: null, snippetHash: null, confidence: 0.9 },
      { id: "ev-2", cardId: "card-new", fieldPath: "variables[0]", chunkId: "chunk-b", sourceLocatorJson: "{}", quoteHash: null, snippetHash: null, confidence: 0.8 },
    ];
    const matrix = buildLiteratureMatrix(["lit-a", "lit-missing"], cards, evidence, ["method", "variables"]);
    expect(matrix[0].cells).toEqual([
      { literatureId: "lit-a", cardId: "card-new", cardStatus: "reviewed", value: { value: "TWFE" }, evidenceCount: 1 },
      { literatureId: "lit-missing", cardId: null, cardStatus: "missing", value: null, evidenceCount: 0 },
    ]);
    expect(matrix[1].cells[0].evidenceCount).toBe(1);
  });
});
