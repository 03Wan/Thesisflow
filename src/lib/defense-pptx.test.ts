import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildDefensePptxBytes } from "./defense-pptx";

describe("defense pptx export", () => {
  it("builds a real 12-slide Open XML package", async () => {
    const slides = Array.from({ length: 12 }, (_, index) => ({ title: `第${index + 1}页`, body: `内容${index + 1}` }));
    const bytes = await buildDefensePptxBytes(slides);
    const packageFile = await JSZip.loadAsync(bytes);
    expect(packageFile.file("[Content_Types].xml")).toBeTruthy();
    expect(packageFile.file("ppt/presentation.xml")).toBeTruthy();
    expect(packageFile.file("ppt/slides/slide12.xml")).toBeTruthy();
    expect(await packageFile.file("ppt/slides/slide12.xml")!.async("text")).toContain("第12页");
  });
});
