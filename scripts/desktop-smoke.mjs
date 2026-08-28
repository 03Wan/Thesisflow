import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const executable = resolve("src-tauri/target/debug/thesisflow.exe");
if (!existsSync(executable)) { console.error(`Missing ${executable}; run npm run tauri -- build --debug --no-bundle first.`); process.exit(1); }
const child = spawn(executable, [], { cwd: resolve("src-tauri/target/debug"), windowsHide: true, stdio: "ignore" });
let exited = false;
child.once("exit", () => { exited = true; });
await new Promise((resolvePromise) => setTimeout(resolvePromise, 8000));
if (exited) { console.error("Desktop smoke FAIL: Tauri exited before 8 seconds."); process.exitCode = 1; }
else { console.log("Desktop smoke PASS: Tauri process remained alive for 8 seconds."); child.kill(); }
