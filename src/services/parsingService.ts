import { createLocalParserRegistry } from "@/parsers/defaultRegistry";
import { LocalParseStorage } from "@/services/localParseStorage";
import { ParseOrchestrator } from "@/services/parseOrchestrator";

/** Production entry point: pages call this service, never parser adapters directly. */
export const parsingService = new ParseOrchestrator(new LocalParseStorage(), createLocalParserRegistry());
