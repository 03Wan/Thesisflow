import type { DocumentParseInput, DocumentParseResult, DocumentParser } from "@/types/document";

export class ParserRegistry {
  private readonly parsers: DocumentParser[] = [];

  register(parser: DocumentParser): this {
    if (this.parsers.some((item) => item.id === parser.id)) throw new Error(`Parser already registered: ${parser.id}`);
    this.parsers.push(parser);
    return this;
  }

  find(input: Pick<DocumentParseInput, "mimeType">): DocumentParser | undefined {
    return this.parsers.find((parser) => parser.supports(input));
  }

  async parse(input: DocumentParseInput): Promise<{ parser: DocumentParser; result: DocumentParseResult }> {
    const parser = this.find(input);
    if (!parser) throw new Error(`No local parser registered for ${input.mimeType ?? "unknown MIME type"}`);
    return { parser, result: await parser.parse(input) };
  }
}
