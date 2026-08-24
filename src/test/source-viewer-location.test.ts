import { describe, expect, it } from "vitest";
import { toSourceViewerLocation } from "@/services/sourceViewerLocation";
describe("source viewer location",()=>it("retains file and PDF page context",()=>expect(toSourceViewerLocation("file-1",{format:"pdf",pageNumber:7,blockIndex:2})).toMatchObject({projectFileId:"file-1",pageNumber:7,label:"PDF 第 7 页"})));
