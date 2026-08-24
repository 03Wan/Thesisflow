import { describe, expect, it } from "vitest";
import { CrossrefSearchProvider, OpenAlexSearchProvider } from "@/services/scholarlySearch";

const enabled = process.env.PHASE5_REAL_PROVIDER_SMOKE === "1";
const real = enabled ? it : it.skip;

describe("Phase 5 real scholarly provider smoke", () => {
  real("looks up a DOI through Crossref and normalizes it", async () => {
    const record = await new CrossrefSearchProvider().lookupByDoi("https://doi.org/10.1038/s41586-020-2649-2");
    expect(record).toMatchObject({ doi: "10.1038/s41586-020-2649-2", provider: "crossref" });
    expect(record?.title.length).toBeGreaterThan(5);
  }, 20_000);

  real("searches OpenAlex without downloading full text", async () => {
    const page = await new OpenAlexSearchProvider().search("digital transformation firm innovation", { yearFrom: 2020 }, "*");
    expect(page.records.length).toBeGreaterThan(0);
    expect(page.records.every((record) => record.provider === "openalex")).toBe(true);
    expect(page.records.every((record) => record.citationCountSource === "openalex")).toBe(true);
  }, 20_000);
});
