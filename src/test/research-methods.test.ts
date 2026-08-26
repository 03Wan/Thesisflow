import { describe, expect, it } from "vitest";
import { parseResearchMethods, serializeResearchMethods } from "@/lib/research-methods";

describe("research methods", () => {
  it("persists multi-select values in a stable order", () => {
    expect(serializeResearchMethods(["访谈研究", "问卷研究"])).toBe('["问卷研究","访谈研究"]');
  });

  it("continues to read legacy comma-separated project values", () => {
    expect(parseResearchMethods("问卷研究、案例研究")).toEqual(["问卷研究", "案例研究"]);
  });
});
