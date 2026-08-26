import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const forbidden = [
  /\bFakeProvider\b/,
  /\bFakeSecretStore\b/,
  /\bFakeDocumentParser\b/,
  /\brevisionMock\b/,
  /Mock 编辑上下文/,
  /历史 Mock 结果/,
  /数据研究 mock/i,
  /模拟得分/,
  /示例论文/,
  /数字经济对企业创新/,
];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "test" ? [] : files(path);
    return /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

const matches = [];
for (const file of await files(root)) {
  const text = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) matches.push(`${relative(root, file)}: ${pattern}`);
  }
}

if (matches.length) {
  console.error("Production boundary violation:\n" + matches.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Production boundary scan passed: no forbidden Mock business data or test doubles in src/ runtime scope.");
}
