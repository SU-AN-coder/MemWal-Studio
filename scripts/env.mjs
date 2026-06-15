import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export const repoRoot = resolve(import.meta.dirname, "..");
export const envPath = resolve(repoRoot, ".env");

export function loadEnv() {
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    env[key] = value;
  }

  return env;
}

export function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.join(", ")}`);
  }
}

export function updateEnv(updates) {
  const current = new Map();
  if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (!rawLine || rawLine.trim().startsWith("#") || !rawLine.includes("=")) {
        continue;
      }
      const index = rawLine.indexOf("=");
      current.set(rawLine.slice(0, index), rawLine.slice(index + 1));
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    current.set(key, value ?? "");
  }

  const output = Array.from(current.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  writeFileSync(envPath, `${output}\n`, "utf8");
}

export function redacted(value) {
  if (!value) return "";
  if (value.length <= 12) return "<redacted>";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
