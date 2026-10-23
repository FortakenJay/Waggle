import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const [outputPath, ...cliArgs] = process.argv.slice(2);
if (!outputPath || cliArgs.length === 0) {
  throw new Error(
    "Usage: node scripts/capture-cli.mjs <output.svg> <waggle arguments...>",
  );
}

const root = resolve(import.meta.dirname, "..");
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "src/index.ts", ...cliArgs],
  {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      WAGGLE_HOME:
        process.env.WAGGLE_HOME ?? resolve(root, ".tmp-capture-home"),
    },
  },
);

const command = `$ waggle ${cliArgs.join(" ")}`;
const output = [command, "", result.stdout.trimEnd(), result.stderr.trimEnd()]
  .filter((part, index) => part || index < 2)
  .join("\n");
const lines = output.split("\n");
const width = Math.max(760, Math.min(1400, 56 + Math.max(...lines.map((line) => line.length)) * 8.2));
const height = 68 + lines.length * 21;

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const text = lines
  .map(
    (line, index) =>
      `<text x="28" y="${54 + index * 21}" class="${index === 0 ? "command" : "output"}">${escapeXml(line) || " "}</text>`,
  )
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">waggle terminal output</title>
  <desc id="desc">Verified output from ${escapeXml(command)}</desc>
  <rect width="${width}" height="${height}" rx="12" fill="#0d1117"/>
  <circle cx="20" cy="20" r="5" fill="#ff5f57"/>
  <circle cx="38" cy="20" r="5" fill="#febc2e"/>
  <circle cx="56" cy="20" r="5" fill="#28c840"/>
  <style>
    text { font: 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre; }
    .command { fill: #79c0ff; }
    .output { fill: #e6edf3; }
  </style>
${text}
</svg>
`;

const destination = resolve(root, outputPath);
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, svg);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}
