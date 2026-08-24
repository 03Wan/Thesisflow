import { normalizeIdentifier } from "@/services/literatureServices";

export type ScholarlyRecord = { id: string; title: string; authors: string[]; year: number | null; venue: string | null; doi: string | null; abstract: string | null; citationCount: number | null; citationCountSource: string; openAccess: boolean; landingPage: string | null; oaUrl: string | null; provider: string; externalIds: Record<string, string> };
export type ScholarlyFilters = { title?: string; author?: string; yearFrom?: number; yearTo?: number; type?: string; language?: string };
export type SearchPage = { records: ScholarlyRecord[]; cursor: string | null };
export interface ScholarlySearchProvider { key: string; search(query: string, filters: ScholarlyFilters, cursor?: string): Promise<SearchPage>; lookupByDoi(doi: string): Promise<ScholarlyRecord | null>; lookupById(id: string): Promise<ScholarlyRecord | null>; getOpenAccessLinks(record: ScholarlyRecord): Promise<string[]>; normalize(raw: unknown): ScholarlyRecord; normalizeError(error: unknown): Error; }

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const list = (value: unknown) => Array.isArray(value) ? value : [];
const text = (value: unknown) => typeof value === "string" ? value : null;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const firstText = (value: unknown) => text(list(value)[0]);
const safeOA = (url: string | null) => url && /^https:\/\//i.test(url) ? [url] : [];
const normalizedDoi = (value: unknown) => typeof value === "string" ? normalizeIdentifier("doi", value) : null;

function datePartYear(value: unknown) {
  const dateParts = record(value)["date-parts"];
  const first = list(dateParts)[0];
  return number(list(first)[0]);
}

function crossrefFilter(filters: ScholarlyFilters) {
  return [filters.yearFrom && `from-pub-date:${filters.yearFrom}-01-01`, filters.yearTo && `until-pub-date:${filters.yearTo}-12-31`, filters.type && `type:${filters.type}`].filter(Boolean).join(",");
}

export class CrossrefSearchProvider implements ScholarlySearchProvider {
  key = "crossref";
  constructor(private readonly fetcher: typeof fetch = fetch, private readonly mailto?: string) {}
  normalize(raw: unknown): ScholarlyRecord {
    const container = record(raw); const work = Object.keys(record(container.message)).length ? record(container.message) : container;
    const doi = normalizedDoi(work.DOI); const authors = list(work.author).map((item) => { const author = record(item); return [text(author.family), text(author.given)].filter(Boolean).join(", "); }).filter(Boolean);
    return { id: doi ?? crypto.randomUUID(), title: firstText(work.title) ?? "Untitled", authors, year: datePartYear(work.published) ?? datePartYear(work.issued), venue: firstText(work["container-title"]), doi, abstract: text(work.abstract), citationCount: number(work["is-referenced-by-count"]), citationCountSource: "crossref", openAccess: false, landingPage: text(work.URL) ?? (doi ? `https://doi.org/${doi}` : null), oaUrl: null, provider: this.key, externalIds: doi ? { doi } : {} };
  }
  async search(query: string, filters: ScholarlyFilters, cursor?: string) {
    const url = new URL("https://api.crossref.org/works"); url.searchParams.set("query", query); url.searchParams.set("rows", "20");
    if (filters.title) url.searchParams.set("query.title", filters.title); if (filters.author) url.searchParams.set("query.author", filters.author); if (cursor) url.searchParams.set("cursor", cursor); if (this.mailto) url.searchParams.set("mailto", this.mailto);
    const filter = crossrefFilter(filters); if (filter) url.searchParams.set("filter", filter);
    const response = await this.fetcher(url); if (!response.ok) throw this.normalizeError(response);
    const body = record(await response.json()); const message = record(body.message);
    return { records: list(message.items).map((item) => this.normalize(item)), cursor: text(message["next-cursor"]) };
  }
  async lookupByDoi(doi: string) { const response = await this.fetcher(`https://api.crossref.org/works/${encodeURIComponent(normalizeIdentifier("doi", doi))}`); return response.ok ? this.normalize(await response.json()) : null; }
  async lookupById(id: string) { return this.lookupByDoi(id); }
  async getOpenAccessLinks(item: ScholarlyRecord) { return safeOA(item.oaUrl); }
  normalizeError(error: unknown) { void error; return new Error("Crossref metadata unavailable; retry later."); }
}

export class OpenAlexSearchProvider implements ScholarlySearchProvider {
  key = "openalex";
  constructor(private readonly fetcher: typeof fetch = fetch, private readonly apiKey?: string) {}
  normalize(raw: unknown): ScholarlyRecord {
    const work = record(raw); const doi = normalizedDoi(work.doi); const openAccess = record(work.open_access); const oaUrl = text(openAccess.oa_url); const primaryLocation = record(work.primary_location); const source = record(primaryLocation.source);
    const authors = list(work.authorships).map((item) => text(record(record(item).author).display_name)).filter((item): item is string => !!item);
    return { id: text(work.id) ?? doi ?? crypto.randomUUID(), title: text(work.title) ?? "Untitled", authors, year: number(work.publication_year), venue: text(source.display_name), doi, abstract: null, citationCount: number(work.cited_by_count), citationCountSource: "openalex", openAccess: openAccess.is_oa === true, landingPage: text(work.doi) ?? text(work.id), oaUrl, provider: this.key, externalIds: { ...(text(work.id) ? { openalex: text(work.id)! } : {}), ...(doi ? { doi } : {}) } };
  }
  async search(query: string, filters: ScholarlyFilters, cursor?: string) {
    const url = new URL("https://api.openalex.org/works"); url.searchParams.set("search", [query, filters.title, filters.author].filter(Boolean).join(" ")); url.searchParams.set("per-page", "20"); if (cursor) url.searchParams.set("cursor", cursor); if (this.apiKey) url.searchParams.set("api_key", this.apiKey);
    const filter = [filters.yearFrom && `from_publication_date:${filters.yearFrom}-01-01`, filters.yearTo && `to_publication_date:${filters.yearTo}-12-31`, filters.type && `type:${filters.type}`, filters.language && `language:${filters.language}`].filter(Boolean).join(","); if (filter) url.searchParams.set("filter", filter);
    const response = await this.fetcher(url); if (!response.ok) throw this.normalizeError(response);
    const body = record(await response.json()); return { records: list(body.results).map((item) => this.normalize(item)), cursor: text(record(body.meta).next_cursor) };
  }
  async lookupByDoi(doi: string) { const id = `doi:${normalizeIdentifier("doi", doi)}`; return this.lookupById(id); }
  async lookupById(id: string) { const url = new URL(`https://api.openalex.org/works/${encodeURIComponent(id)}`); if (this.apiKey) url.searchParams.set("api_key", this.apiKey); const response = await this.fetcher(url); return response.ok ? this.normalize(await response.json()) : null; }
  async getOpenAccessLinks(item: ScholarlyRecord) { return item.openAccess ? safeOA(item.oaUrl) : []; }
  normalizeError(error: unknown) { void error; return new Error("OpenAlex metadata unavailable; retry later."); }
}

export class CachedScholarlySearch {
  private readonly cache = new Map<string, { until: number; page: SearchPage }>();
  constructor(private readonly provider: ScholarlySearchProvider, private readonly ttlMs = 60_000) {}
  async search(query: string, filters: ScholarlyFilters, cursor?: string) {
    const key = JSON.stringify([query, filters, cursor]); const hit = this.cache.get(key); if (hit && hit.until > Date.now()) return hit.page;
    try { const page = await this.provider.search(query, filters, cursor); this.cache.set(key, { until: Date.now() + this.ttlMs, page }); return page; }
    catch { throw new Error("Online search unavailable. Local literature remains available; retry later."); }
  }
}

export function oaPreview(item: ScholarlyRecord) { const url = item.oaUrl; return item.openAccess && url ? { url, domain: new URL(url).hostname, fileType: "unknown", isOpenAccess: true } : null; }
