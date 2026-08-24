import { DocxParser } from "./DocxParser";
import { LegacyDocParser, TauriLegacyDocConverter, type LegacyDocConverter } from "./LegacyDocParser";
import { ParserRegistry } from "./ParserRegistry";
import { PdfParser } from "./PdfParser";
import { CsvParser, XlsxParser } from "./SpreadsheetParsers";
import { MarkdownParser, TxtParser } from "./TextParsers";

export function createLocalParserRegistry(converter: LegacyDocConverter | null = new TauriLegacyDocConverter()) {
  const registry = new ParserRegistry();
  registry.register(new DocxParser()).register(new PdfParser()).register(new XlsxParser()).register(new CsvParser()).register(new TxtParser()).register(new MarkdownParser());
  return registry.register(new LegacyDocParser(converter, registry));
}
