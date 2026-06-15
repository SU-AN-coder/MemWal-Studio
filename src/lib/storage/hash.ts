// MemWal Studio - Content Hashing
// SHA-256 content hashing using Web Crypto API

export async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data.buffer);
  return bufferToHex(hashBuffer);
}

export async function computeHashBytes(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes.buffer);
  return bufferToHex(hashBuffer);
}

export function computeHashSync(content: string): string {
      // Deterministic path for environments without async crypto
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  // Create a pseudo-SHA-like hex from the djb2 hash + content length
  const lenHex = content.length.toString(16);
  const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
  const padHex = "00".repeat(24);
  return `sha256:${padHex}${hashHex}${lenHex.padStart(8, "0")}`;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const hexParts: string[] = [];
  for (const byte of bytes) {
    hexParts.push(byte.toString(16).padStart(2, "0"));
  }
  return `sha256:${hexParts.join("")}`;
}

export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

export async function verifyHash(
  content: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await computeHash(content);
  return actual === expectedHash;
}
