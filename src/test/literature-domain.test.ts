import { describe, expect, it } from "vitest";
import { mayReplaceCanonicalField, normalizeIdentifier, validateAuthorOrder } from "@/services/literatureServices";
describe("literature domain", () => {
  it("normalizes DOI case and resolver URL forms", () => { expect(normalizeIdentifier("doi", "https://doi.org/10.1000/ABC.Def")).toBe("10.1000/abc.def"); expect(normalizeIdentifier("doi", "doi:10.1000/ABC.Def")).toBe("10.1000/abc.def"); });
  it("protects a user-confirmed field from background enrichment", () => { expect(mayReplaceCanonicalField({ sourceType: "user_confirmed", trustLevel: 5 }, { sourceType: "verified_external_metadata", trustLevel: 4 })).toBe(false); expect(mayReplaceCanonicalField({ sourceType: "file_metadata", trustLevel: 3 }, { sourceType: "verified_external_metadata", trustLevel: 4 })).toBe(true); });
  it("requires contiguous deterministic author order", () => { expect(validateAuthorOrder([0, 1, 2])).toBe(true); expect(validateAuthorOrder([0, 2])).toBe(false); });
});
