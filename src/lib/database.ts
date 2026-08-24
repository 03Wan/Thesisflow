import Database from "@tauri-apps/plugin-sql";
import { toAppError } from "./app-error";

export const THESISFLOW_DATABASE_URL = "sqlite:thesisflow.db";

let databasePromise: Promise<Database> | undefined;

export function getDatabase(): Promise<Database> {
  databasePromise ??= Database.load(THESISFLOW_DATABASE_URL).catch((error) => {
    databasePromise = undefined;
    throw toAppError(error, "无法打开 ThesisFlow 本地数据库。");
  });
  return databasePromise;
}
