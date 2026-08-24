import { describe, expect, it } from "vitest";
import { createLocalParserRegistry } from "@/parsers/defaultRegistry";
describe("default local parser registry", () => { it("owns every supported format adapter", () => { const registry = createLocalParserRegistry(); expect(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain", "text/markdown", "application/msword"].every((mimeType) => registry.find({ mimeType }))).toBe(true); }); });
