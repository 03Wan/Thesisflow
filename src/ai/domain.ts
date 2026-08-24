import type { EntityId, IsoDateTime } from "@/types/domain";

export const AI_CAPABILITIES = ["text_generation", "streaming", "structured_output", "tool_calling", "vision", "embeddings"] as const;
export type AICapability = (typeof AI_CAPABILITIES)[number];
export type AICapabilities = ReadonlySet<AICapability>;
export type AIRunStatus = "queued" | "running" | "streaming" | "succeeded" | "failed" | "cancelled" | "timed_out";
export type AIValidationStatus = "pending" | "valid" | "invalid" | "not_applicable";

export interface AIModelDescriptor { id: string; displayName: string; providerKey: string; capabilities: AICapabilities; contextWindow?: number; maxOutput?: number; deprecated?: boolean; available?: boolean; source: "provider" | "user" | "cached"; }
export type AIConnectionStatus = "success" | "auth_error" | "network_error" | "rate_limited" | "unsupported" | "unknown";
/** Resolved only by the native credential boundary; never retain this value in UI state. */
export interface ResolvedProviderConfig { secret: string; baseUrlOverride?: string; organization?: string; project?: string; defaultModel?: string; }
export interface AIConnectionResult { status: AIConnectionStatus; messageSafe?: string; modelId?: string; }
export interface AIProvider { key: string; displayName: string; getCapabilities(model?: string): AICapabilities; listModels?(config: ResolvedProviderConfig, signal?: AbortSignal): Promise<AIModelDescriptor[]>; testConnection(config: ResolvedProviderConfig, signal?: AbortSignal): Promise<AIConnectionResult>; generate(request: AIRequest, config: ResolvedProviderConfig, signal: AbortSignal): Promise<AIResponse>; stream(request: AIRequest, config: ResolvedProviderConfig, signal: AbortSignal): AsyncIterable<AIStreamEvent>; normalizeError(error: unknown): AIError; normalizeUsage(response: unknown): AIUsage | undefined; }
export interface AIUsage { inputUnits?: number; outputUnits?: number; cachedUnits?: number; raw?: Record<string, unknown>; }
export interface AIError { code: string; messageSafe: string; retryable: boolean; providerRequestId?: string; }
export type ContextTrustLevel = "trusted_system" | "trusted_project_fact" | "user_input" | "untrusted_document";
export interface ContextItem { id: string; type?: "project_fact" | "confirmed_rule" | "page_state" | "selected_text" | "source" | "user_instruction"; trustLevel?: ContextTrustLevel; text?: string; data?: Record<string, unknown>; sourceFileId?: string; sourceLocator?: Record<string, unknown>; sizeEstimate?: number; kind?: "project_fact" | "document_excerpt" | "user_input"; content?: string; trusted?: boolean; }
export interface ContextPack { projectId?: EntityId; taskKey?: string; trustedFacts?: readonly ContextItem[]; confirmedRules?: readonly ContextItem[]; currentStage?: ContextItem | null; currentPageState?: ContextItem | null; selectedText?: ContextItem | null; sourceItems?: readonly ContextItem[]; userInstruction?: ContextItem; items: readonly ContextItem[]; manifest: { itemIds: readonly string[]; totalCharacters: number; clippedItemIds?: readonly string[]; }; }
export interface PromptTemplateDescriptor { key: string; version: string; description?: string; taskType?: string; systemTemplate?: string; userTemplate?: string; requiredContext?: readonly NonNullable<ContextItem["type"]>[]; outputSchemaKey?: string; schemaKey?: string; role: "system" | "developer" | "user"; enabled: boolean; }
export interface StructuredOutputSchema { key: string; version: string; jsonSchema: Record<string, unknown>; }
export interface AIRequest { task: AITask; modelId: string; prompt: PromptTemplateDescriptor; context: ContextPack; structuredOutput?: StructuredOutputSchema; requestId: string; }
export interface AITask { key: string; displayName: string; requiredCapabilities: readonly AICapability[]; }
export type AIStreamEvent = { type: "start" } | { type: "text_delta"; text: string } | { type: "usage"; usage: AIUsage } | { type: "completed"; response: AIResponse } | { type: "error"; error: AIError } | { type: "cancelled" };
export interface AIResponse { text: string; structured?: unknown; usage?: AIUsage; providerRequestId?: string; metadata?: Record<string, unknown>; }
export interface AIRun { id: EntityId; projectId: EntityId | null; taskKey: string; providerKey: string; modelId: string; promptTemplateKey: string; promptTemplateVersion: string; contextManifest: ContextPack["manifest"]; status: AIRunStatus; startedAt: IsoDateTime; completedAt: IsoDateTime | null; cancelledAt: IsoDateTime | null; error: AIError | null; requestId: string | null; providerRequestId: string | null; usage: AIUsage | null; }

export function validateContextPack(context: ContextPack): void {
  if (!context.items.length) throw new Error("ContextPack 至少需要一个上下文项。");
  if (context.manifest.totalCharacters < 0) throw new Error("ContextPack 字符数无效。");
  if (context.items.some((item) => !item.id || (!item.text && !item.data) || (item.type === "source" && item.trustLevel !== "untrusted_document"))) throw new Error("ContextPack 信任边界无效。");
}

export function supportsTask(model: AIModelDescriptor, task: AITask): boolean { return task.requiredCapabilities.every((capability) => model.capabilities.has(capability)); }
