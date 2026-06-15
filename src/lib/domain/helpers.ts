// MemWal Studio - ID and Time Helpers
// Deterministic ID generation and timestamp utilities

let idCounter = 0;

export function generateId(prefix: string): string {
  idCounter += 1;
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  const counterPart = idCounter.toString(36);
  return `${prefix}_${timePart}_${randomPart}_${counterPart}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function shortId(id: string, prefix = 8, suffix = 4): string {
  if (id.length <= prefix + suffix + 3) return id;
  return `${id.slice(0, prefix)}...${id.slice(-suffix)}`;
}

export function truncatedHash(hash: string, prefix = 6, suffix = 4): string {
  if (hash.length <= prefix + suffix + 3) return hash;
  return `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`;
}
