import type { EntityId, IsoDateTime } from "./domain";

export type ParseStatus = "queued" | "parsing" | "parsed" | "failed" | "unsupported" | "needs_ocr" | "stale";
export type ParseErrorCode = "unsupported_format" | "invalid_document" | "encrypted_document" | "converter_unavailable" | "converter_failed" | "io_error" | "internal_error";
export type DocumentBlockType = "heading" | "paragraph" | "list_item" | "table" | "table_row" | "table_cell" | "header" | "footer" | "other";

export type SourceLocator =
  | { format: "pdf"; pageNumber: number; blockIndex: number; bbox?: [number, number, number, number] }
  | { format: "docx"; paragraphIndex?: number; tableIndex?: number; row?: number; cell?: number; headingPath?: string[] }
  | { format: "xlsx"; sheet: string; cellRange: string }
  | { format: "txt_md"; lineStart: number; lineEnd: number }
  | { format: "legacy_converted"; converter: string; convertedFile: string; locator: SourceLocator };

export interface DocumentBlock {
  id: string;
  type: DocumentBlockType;
  text: string;
  order: number;
  level?: number;
  style?: string;
  locator: SourceLocator;
  metadata: Record<string, unknown>;
}

export interface NormalizedDocument {
  documentId: EntityId;
  projectFileId: EntityId;
  title: string;
  mimeType: string | null;
  language: string | null;
  pageCount: number | null;
  blocks: DocumentBlock[];
  metadata: Record<string, unknown>;
  warnings: string[];
}

export interface DocumentParseInput {
  documentId: EntityId;
  projectId: EntityId;
  projectFileId: EntityId;
  title: string;
  mimeType: string | null;
  text: string;
  bytes?: Uint8Array;
  onProgress?: (completed: number, total?: number) => void;
  /** Parsers should stop at a safe boundary when this signal is aborted. */
  signal?: AbortSignal;
}

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  recoverable: boolean;
}

export interface DocumentParseResult {
  status: ParseStatus;
  document?: NormalizedDocument;
  error?: ParseError;
  warnings: string[];
}

export interface DocumentParser {
  readonly id: string;
  readonly version: string;
  supports(input: Pick<DocumentParseInput, "mimeType">): boolean;
  parse(input: DocumentParseInput): Promise<DocumentParseResult>;
}

export interface DocumentParse {
  id: EntityId;
  projectId: EntityId;
  projectFileId: EntityId;
  parserType: string;
  parserVersion: string;
  status: ParseStatus;
  contentHash: string | null;
  normalizedPath: string | null;
  mimeType: string | null;
  language: string | null;
  pageCount: number | null;
  blockCount: number;
  textLength: number;
  durationMs: number | null;
  warningCount: number;
  errorCode: ParseErrorCode | null;
  errorMessage: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface RuleCondition { operator: "and" | "or" | "not" | "equals" | "includes" | "range"; field?: string; value?: unknown; children?: RuleCondition[]; }
export type RuleCandidateStatus = "pending" | "confirmed" | "edited" | "rejected" | "superseded" | "conflict";
export interface RuleCandidate { id: EntityId; projectId: EntityId; projectFileId: EntityId; documentParseId: EntityId; ruleKey: string; category: string; value: unknown; unit: string | null; rawText: string; locator: SourceLocator; confidence: number; extractor: string; condition: RuleCondition | null; exception: RuleCondition | null; status: RuleCandidateStatus; createdAt: IsoDateTime; updatedAt: IsoDateTime; }
export interface ThesisRule { id: EntityId; projectId: EntityId; ruleKey: string; category: string; value: unknown; unit: string | null; scope: string; condition: RuleCondition | null; exception: RuleCondition | null; sourceCandidateId: EntityId | null; sourceFileId: EntityId | null; sourceLocator: SourceLocator | null; status: "draft" | "active" | "superseded" | "archived"; version: number; effectiveFrom: IsoDateTime | null; createdAt: IsoDateTime; updatedAt: IsoDateTime; }
export interface RuleConflict { id: EntityId; projectId: EntityId; ruleKey: string; leftCandidateId: EntityId | null; rightCandidateId: EntityId | null; leftRuleId: EntityId | null; rightRuleId: EntityId | null; status: "open" | "resolved" | "dismissed"; resolution: unknown | null; createdAt: IsoDateTime; updatedAt: IsoDateTime; }
