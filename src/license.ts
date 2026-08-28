const SLUG = 'practice-loop-notebook';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;
export const BILLING_BASE = (import.meta.env.VITE_BILLING_BASE as string | undefined) ?? 'https://api.sociobot.in';
export const CHECKOUT_URL = `${BILLING_BASE}/api/v1/products/${SLUG}/checkout`;

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
}

export function captureReturnedLicense(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 } satisfies CachedVerdict));
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function saveLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export function hasOptimisticUnlock(): boolean {
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token) return false;
  const raw = localStorage.getItem(VERDICT_KEY);
  if (!raw) return true;
  try { return (JSON.parse(raw) as CachedVerdict).valid; } catch { return true; }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason: string }> {
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token) return { valid: false, reason: 'missing' };
  const raw = localStorage.getItem(VERDICT_KEY);
  if (!force && raw) {
    try {
      const cached = JSON.parse(raw) as CachedVerdict;
      if (Date.now() - cached.checkedAt < DAY) return { valid: cached.valid, reason: 'cached' };
    } catch { /* verify malformed cache */ }
  }
  const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is unavailable. Your notebook still works offline.');
  const result = await response.json() as { valid: boolean; reason: string };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() } satisfies CachedVerdict));
  return result;
}
