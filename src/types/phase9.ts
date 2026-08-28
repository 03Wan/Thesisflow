import type { ThesisCitation, ThesisExportManifest, ThesisRevision, ThesisSection, ThesisSourceLink } from "./writing";

export type Phase9Status = "PASS" | "FAIL" | "REVIEW" | "UNSUPPORTED";
export type Phase9IssueStatus = "open" | "resolved" | "dismissed" | "stale";
export type Phase9Category = "requirements" | "citation/source" | "empirical consistency" | "logic/structure" | "format/export";

export interface Phase9Evidence { id: string; label: string; locator?: string | null; snapshotHash?: string | null; }
export interface Phase9CheckResult {
  id: string; checkId: string; category: Phase9Category; label: string; status: Phase9Status;
  severity: "blocking" | "high" | "medium" | "low"; machineVerifiable: boolean;
  observed: unknown; expected: unknown; evidence: Phase9Evidence[]; manualAction?: string | null;
  revisionHash: string; checkedAt: string; checkerVersion: string;
}
export interface Phase9Issue {
  id: string; fingerprint: string; category: Phase9Category; sourceChecker: string;
  severity: "blocking" | "high" | "medium" | "low"; status: Phase9IssueStatus;
  sectionId?: string | null; anchor?: string | null; sourceIds: string[]; evidence: Phase9Evidence[];
  message: string; observed: unknown; expected: unknown; createdAt: string; checkedAt: string;
  checkVersion: string; dismissReason?: string | null;
}
export interface Phase9ManualConfirmation { id: string; checkId: string; note: string; confirmedAt: string; }
export interface Phase9Report { revisionHash: string; checks: Phase9CheckResult[]; issues: Phase9Issue[]; generatedAt: string; checkerVersion: string; }
export interface ReleaseCandidate {
  id: string; projectId: string; documentId: string; label: string; status: "candidate" | "active" | "superseded";
  ready: boolean; generatedAt: string; revisionId: string; revisionHash: string;
  requirementsSnapshot: { version: string; hash: string; ids: string[] };
  citationSnapshot: { hash: string; citationIds: string[]; literatureIds: string[] };
  evidenceSnapshot: { hash: string; linkIds: string[]; staleIds: string[] };
  qaSummary: { openBlocking: number; openFail: number; review: number; dismissed: number; unsupported: number; manualConfirmations: number };
  exportManifest: ThesisExportManifest | null; manifestHash: string; appVersion: string; schemaVersion: string; checkerVersion: string;
  backup: { revision: ThesisRevision; sections: ThesisSection[]; citations: ThesisCitation[]; links: ThesisSourceLink[] };
}
