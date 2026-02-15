export function toNumberSafe(v: unknown): number {
  if (typeof v === 'number') return v;

  if (v && typeof v === 'object' && 'toNumber' in v) {
    return (v as { toNumber(): number }).toNumber();
  }

  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}
