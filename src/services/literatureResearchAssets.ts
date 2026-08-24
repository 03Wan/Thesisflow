import type { Author, Identifier, LiteratureCard, LiteratureCardEvidence, LiteratureItem } from "@/types/literature";

export type CslName = { given?: string; family?: string; literal?: string };
export type CslJsonItem = {
  id: string;
  type: string;
  title: string;
  author?: CslName[];
  issued?: { "date-parts": number[][] };
  "container-title"?: string;
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  language?: string;
  DOI?: string;
  URL?: string;
};

export type CitationAsset = {
  schemaVersion: "csl-json.v1";
  projectId: string;
  generatedAt: string;
  items: CslJsonItem[];
};

export type LiteratureMatrixCell = {
  literatureId: string;
  cardId: string | null;
  cardStatus: LiteratureCard["status"] | "missing";
  value: unknown;
  evidenceCount: number;
};

export type LiteratureMatrixRow = { fieldPath: string; cells: LiteratureMatrixCell[] };

const compact = <T extends Record<string, unknown>>(value: T): T => {
  for (const key of Object.keys(value)) if (value[key] === undefined || value[key] === "") delete value[key];
  return value;
};

function cslType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (["article", "journal_article", "journal-article"].includes(normalized)) return "article-journal";
  if (["book", "monograph"].includes(normalized)) return "book";
  if (["chapter", "book_chapter", "book-chapter"].includes(normalized)) return "chapter";
  if (["thesis", "dissertation"].includes(normalized)) return "thesis";
  if (["conference", "conference_paper", "proceedings-article"].includes(normalized)) return "paper-conference";
  return "document";
}

function cslAuthor(author: Author): CslName {
  return author.literalName
    ? { literal: author.literalName }
    : compact({ given: author.givenName || undefined, family: author.familyName || undefined });
}

export function toCslJson(item: LiteratureItem, authors: readonly Author[], identifiers: readonly Identifier[]): CslJsonItem {
  const identifier = (scheme: Identifier["scheme"]) => identifiers.find((candidate) => candidate.scheme === scheme)?.normalizedValue;
  return compact({
    id: item.preferredCitationKey ?? item.id,
    type: cslType(item.literatureType),
    title: item.title,
    author: authors.length ? authors.map(cslAuthor) : undefined,
    issued: item.year ? { "date-parts": [[item.year]] } : undefined,
    "container-title": item.venue ?? undefined,
    volume: item.volume ?? undefined,
    issue: item.issue ?? undefined,
    page: item.pages ?? undefined,
    publisher: item.publisher ?? undefined,
    language: item.language ?? undefined,
    DOI: identifier("doi"),
    URL: identifier("url"),
  });
}

export function buildCitationAsset(projectId: string, generatedAt: string, items: Array<{ item: LiteratureItem; authors: Author[]; identifiers: Identifier[] }>): CitationAsset {
  if (items.some((entry) => entry.item.projectId !== projectId)) throw new Error("Citation asset cannot include literature from another project.");
  return { schemaVersion: "csl-json.v1", projectId, generatedAt, items: items.map((entry) => toCslJson(entry.item, entry.authors, entry.identifiers)) };
}

function parseCard(card: LiteratureCard | undefined): Record<string, unknown> {
  if (!card?.structuredJson) return {};
  try {
    const parsed = JSON.parse(card.structuredJson) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function buildLiteratureMatrix(literatureIds: readonly string[], cards: readonly LiteratureCard[], evidence: readonly LiteratureCardEvidence[], fieldPaths?: readonly string[]): LiteratureMatrixRow[] {
  const selectedCards = new Map<string, LiteratureCard>();
  for (const card of cards) {
    if (!literatureIds.includes(card.literatureId)) continue;
    const current = selectedCards.get(card.literatureId);
    if (!current || Date.parse(card.updatedAt) > Date.parse(current.updatedAt)) selectedCards.set(card.literatureId, card);
  }
  const payloads = new Map([...selectedCards].map(([literatureId, card]) => [literatureId, parseCard(card)]));
  const fields = fieldPaths?.length
    ? [...new Set(fieldPaths)]
    : [...new Set([...payloads.values()].flatMap((payload) => Object.keys(payload)))].sort();
  return fields.map((fieldPath) => ({
    fieldPath,
    cells: literatureIds.map((literatureId) => {
      const card = selectedCards.get(literatureId);
      return {
        literatureId,
        cardId: card?.id ?? null,
        cardStatus: card?.status ?? "missing",
        value: payloads.get(literatureId)?.[fieldPath] ?? null,
        evidenceCount: card ? evidence.filter((item) => item.cardId === card.id && (item.fieldPath === fieldPath || item.fieldPath.startsWith(`${fieldPath}[`))).length : 0,
      };
    }),
  }));
}
