import { describe, expect, it } from "vitest";
import { getFileUsage } from "@/lib/file-usage";

describe("file usage routing", () => {
  it("routes data files to the research workspace with an actionable next step", () => {
    expect(getFileUsage("data")).toEqual({
      destination: "/implementation",
      destinationLabel: "数据与调研",
      nextStep: "整理数据来源、字段与分析记录",
    });
  });
});
