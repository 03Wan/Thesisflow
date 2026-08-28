import type { Phase9Issue, ReleaseCandidate } from "./phase9";
import type { ThesisSection, ThesisSourceLink } from "./writing";

export type DefenseCardKind = "problem" | "method" | "evidence" | "conclusion" | "contribution" | "limitation" | "custom";

export interface DefenseSource { id: string; label: string; locator?: string | null; sourceType: "section" | "citation" | "evidence" | "requirement" | "student"; }
export interface DefenseCard { id: string; projectId: string; kind: DefenseCardKind; title: string; body: string; sources: DefenseSource[]; order: number; hidden: boolean; stale: boolean; sourceRevisionHash: string; updatedAt: string; }
export interface DefenseWorkspace { id: string; projectId: string; sourceRcId: string; sourceRevisionHash: string; stale: boolean; cards: DefenseCard[]; createdAt: string; updatedAt: string; }
export interface SlideMaterial { id: string; projectId: string; order: number; title: string; purpose: string; body: string; sources: DefenseSource[]; speakerNotes: string; reviewFlags: string[]; stale: boolean; }
export interface PracticeQuestion { id: string; projectId: string; category: string; prompt: string; sources: DefenseSource[]; answerDraft: string; answerAdvice: string; status: "todo" | "mastered" | "review"; custom: boolean; generationVersion: string; }
export interface RehearsalSession { id: string; projectId: string; startedAt: string; endedAt: string | null; questionIds: string[]; selfAssessment: string; notes: string; }

export interface ArchiveArtifact { logicalId: string; relativePath: string; size: number; sha256: string; type: string; source: string; version: string; optional: boolean; }
export interface ArchiveManifest { schemaVersion: "phase10-archive-1"; archiveId: string; projectId: string; createdAt: string; appVersion: string; artifacts: ArchiveArtifact[]; warnings: string[]; }
export interface ArchivePackage { manifest: ArchiveManifest; files: Record<string, string | Uint8Array>; }
export interface RecoveryReport { operationId: string; projectId: string; inputManifestHash: string; restoredArtifactIds: string[]; migrationVersion: string; status: "completed" | "incomplete" | "rejected"; warnings: string[]; createdAt: string; }

export interface Phase10Inputs { releaseCandidate: ReleaseCandidate; sections: ThesisSection[]; links: ThesisSourceLink[]; issues?: Phase9Issue[]; appVersion: string; }
