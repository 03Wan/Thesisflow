import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import { toAppError } from "./app-error";

let databasePromise: Promise<Database> | undefined;

export function getDatabase(): Promise<Database> {
  databasePromise ??= invoke<string>("portable_database_url").then((url) => Database.load(url)).catch((error) => {
    databasePromise = undefined;
    throw toAppError(error, "无法打开 ThesisFlow 本地数据库。");
  });
  return databasePromise;
}
