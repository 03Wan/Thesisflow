import { describe, expect, it } from "vitest";
import { LiteratureRetriever, type RetrievalResult } from "@/services/literatureRetrieval";

const corpus = [
  { chunkId: "a-method", literatureId: "lit-a", title: "Digital capability and innovation performance", author: "Chen Li", text: "We estimate a fixed-effects panel model. The independent variable is digital capability." },
  { chunkId: "a-finding", literatureId: "lit-a", title: "Digital capability and innovation performance", author: "Chen Li", text: "Digital capability is positively associated with product innovation." },
  { chunkId: "b-method", literatureId: "lit-b", title: "数字化转型与企业创新", author: "王敏", text: "本文采用双重差分法 difference-in-differences 识别数字化转型的影响。" },
  { chunkId: "b-finding", literatureId: "lit-b", title: "数字化转型与企业创新", author: "王敏", text: "数字化转型显著提升企业专利质量。" },
  { chunkId: "c-method", literatureId: "lit-c", title: "融资约束与研发投入", author: "赵强", text: "核心变量包括融资约束和研发投入，并使用工具变量法。" },
  { chunkId: "c-finding", literatureId: "lit-c", title: "融资约束与研发投入", author: "赵强", text: "融资约束降低研发投入。数字化转型可缓解这一关系。" },
];

const lexical = async (query: string): Promise<RetrievalResult[]> => {
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return corpus.map((entry) => {
    const haystack = `${entry.title} ${entry.author} ${entry.text}`.toLocaleLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    return { ...entry, score, retrievalMethod: "lexical" as const, sourceLocator: { format: "pdf" as const, pageNumber: entry.chunkId.endsWith("method") ? 2 : 5, blockIndex: 0 }, snippet: entry.text };
  }).filter((entry) => entry.score > 0);
};

const labelled = [
  { query: "difference-in-differences", expected: "lit-b" },
  { query: "fixed-effects panel model", expected: "lit-a" },
  { query: "融资约束 研发投入", expected: "lit-c" },
  { query: "positively associated product innovation", expected: "lit-a" },
  { query: "Chen Li Digital capability", expected: "lit-a" },
  { query: "数字化转型 专利质量", expected: "lit-b" },
];

describe("Phase 5 labelled retrieval evaluation", () => {
  it.each(labelled)("hits the labelled literature for $query", async ({ query, expected }) => {
    const hits = await new LiteratureRetriever(lexical).retrieve(query, { topK: 3, perDocumentCap: 2, totalContextChars: 1200 });
    expect(hits[0]?.literatureId).toBe(expected);
    expect(hits[0]?.sourceLocator).toMatchObject({ format: "pdf" });
  });

  it("returns multiple documents for a cross-literature Chinese query", async () => {
    const hits = await new LiteratureRetriever(lexical).retrieve("数字化转型", { topK: 5, perDocumentCap: 2, totalContextChars: 1200 });
    expect(new Set(hits.map((hit) => hit.literatureId))).toEqual(new Set(["lit-b", "lit-c"]));
  });

  it("records deterministic lexical precision@1", async () => {
    const results = await Promise.all(labelled.map(async ({ query, expected }) => ({ expected, hits: await new LiteratureRetriever(lexical).retrieve(query, { topK: 3, perDocumentCap: 2, totalContextChars: 1200 }) })));
    const precisionAtOne = results.filter(({ expected, hits }) => hits[0]?.literatureId === expected).length / results.length;
    expect(precisionAtOne).toBe(1);
    expect(results.every(({ hits }) => hits.length <= 3)).toBe(true);
  });

  it("falls back to FTS when semantic retrieval is unavailable", async () => {
    const retriever = new LiteratureRetriever(lexical, async () => { throw new Error("embedding provider unavailable"); });
    const hits = await retriever.retrieve("双重差分法", { topK: 2, perDocumentCap: 1, totalContextChars: 500 });
    expect(hits[0]).toMatchObject({ literatureId: "lit-b", retrievalMethod: "lexical" });
  });

  it("marks fused lexical and semantic evidence as hybrid without mixing dimensions", async () => {
    const semantic = async (): Promise<RetrievalResult[]> => [{ chunkId: "a-method", literatureId: "lit-a", score: .9, retrievalMethod: "semantic", sourceLocator: { format: "pdf", pageNumber: 2, blockIndex: 0 }, snippet: corpus[0].text }];
    const hits = await new LiteratureRetriever(lexical, semantic).retrieve("fixed-effects", { topK: 2, perDocumentCap: 1, totalContextChars: 500 });
    expect(hits[0]).toMatchObject({ chunkId: "a-method", retrievalMethod: "hybrid" });
  });
});
