import { describe, expect, it } from "vitest";
import { mockThesisProject } from "@/data/mock/thesis-project";

describe("mockThesisProject", () => {
  it("exposes the confirmed default thesis metrics", () => {
    expect(mockThesisProject.completion).toBe(58);
    expect(mockThesisProject.currentStage).toBe("正文写作");
    expect(mockThesisProject.metrics.bodyWords).toEqual({ current: 7643, target: 10000 });
    expect(mockThesisProject.metrics.references).toEqual({ current: 17, target: 20 });
    expect(mockThesisProject.metrics.foreignReferences).toEqual({ current: 3, target: 2 });
    expect(mockThesisProject.metrics.journalReferences).toEqual({ current: 15, target: 18 });
    expect(mockThesisProject.metrics.advisorGuidance).toEqual({ current: 4, target: 6 });
  });

  it("provides all overview data from the single project mock", () => {
    const overviewProject = mockThesisProject as typeof mockThesisProject & {
      requirements?: unknown[];
      workflow?: unknown[];
      milestones?: unknown[];
    };

    expect(overviewProject.requirements).toHaveLength(9);
    expect(overviewProject.workflow).toHaveLength(19);
    expect(overviewProject.milestones).toHaveLength(5);
  });
});
