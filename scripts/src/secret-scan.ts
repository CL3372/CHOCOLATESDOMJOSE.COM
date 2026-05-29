/**
 * Secret-scan guardrail.
 *
 * Scans all git-tracked files for high-signal credential patterns and for
 * secret-like assignments in tracked configuration (e.g. `.replit`). Exits
 * non-zero when a likely secret is committed, so it can be wired up as a
 * validation/CI gate to prevent regressions of the credential-exposure fix.
 */
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

interface Finding {
  file: string;
  line: number;
  rule: string;
  preview: string;
}

const KEY_NAME = /(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCOUNT[_-]?ID|CLIENT[_-]?SECRET|ACCESS[_-]?KEY|PRIVATE[_-]?KEY)/i;

const PLACEHOLDER =
  /^(|x{2,}|\.{3,}|<.*>|\$\{.*\}|your[_-].*|changeme|placeholder|todo|example|dummy|none|null|undefined|true|false|\d{1,4})$/i;

const VALUE_PATTERNS: { rule: string; re: RegExp }[] = [
  { rule: "telegram-bot-token", re: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { rule: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { rule: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: "stripe-secret-key", re: /\b(sk|rk)_(live|test)_[0-9A-Za-z]{16,}\b/ },
  { rule: "openai-key", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { rule: "private-key-block", re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { rule: "gmail-app-password", re: /\b[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}\b/ },
];

const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".pdf", ".woff",
  ".woff2", ".ttf", ".eot", ".mp4", ".webm", ".mp3", ".wav", ".zip", ".gz",
  ".lock", ".map",
]);

const SKIP_FILE = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);

function trackedFiles(): string[] {
  return execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(value.trim());
}

function scanFile(file: string): Finding[] {
  const findings: Finding[] = [];
  let content: string;
  try {
    if (statSync(file).size > 1_000_000) return findings;
    content = readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  if (content.includes("\u0000")) return findings;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { rule, re } of VALUE_PATTERNS) {
      if (re.test(line)) {
        findings.push({ file, line: i + 1, rule, preview: redact(line) });
      }
    }

    const assign = line.match(
      /^\s*(?:export\s+)?["']?([A-Za-z0-9_]+)["']?\s*[:=]\s*["']?([^"'#\s][^"'#]*?)["']?\s*$/,
    );
    if (assign) {
      const [, name, rawValue] = assign;
      const value = rawValue.trim();
      if (KEY_NAME.test(name) && value && !isPlaceholder(value)) {
        findings.push({
          file,
          line: i + 1,
          rule: "secret-like-assignment",
          preview: redact(`${name}=${value}`),
        });
      }
    }
  }
  return findings;
}

function redact(line: string): string {
  const trimmed = line.trim().slice(0, 120);
  return trimmed.replace(
    /([A-Za-z0-9_+/:=.-]{8,})/g,
    (m) => (m.length <= 8 ? m : `${m.slice(0, 4)}…${m.slice(-2)}`),
  );
}

function main(): void {
  const files = trackedFiles();
  const all: Finding[] = [];

  for (const file of files) {
    if (SKIP_FILE.has(file.split("/").pop() ?? "")) continue;
    const ext = file.includes(".") ? file.slice(file.lastIndexOf(".")) : "";
    if (SKIP_EXT.has(ext.toLowerCase())) continue;
    all.push(...scanFile(file));
  }

  const deduped = Array.from(
    new Map(all.map((f) => [`${f.file}:${f.line}:${f.rule}`, f])).values(),
  );

  if (deduped.length === 0) {
    console.log("secret-scan: OK — no committed secrets detected in tracked files.");
    return;
  }

  console.error(`secret-scan: FAILED — ${deduped.length} potential secret(s) found in tracked files:\n`);
  for (const f of deduped) {
    console.error(`  ${f.file}:${f.line} [${f.rule}]  ${f.preview}`);
  }
  console.error(
    "\nMove these values to Replit Secrets (runtime-only) and remove them from tracked files.",
  );
  process.exit(1);
}

main();
