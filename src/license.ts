const SLUG = 'practice-loop-notebook';
const REAL_LICENSE_KEY = `sb_license:${SLUG}`;
const DAY = 86_400_000;
export const BILLING_BASE = (import.meta.env.VITE_BILLING_BASE as string | undefined) ?? 'https://api.sociobot.in';
export const CHECKOUT_URL = `${BILLING_BASE}/api/v1/products/${SLUG}/checkout`;
let demoMode = false;

export function setLicenseDemoMode(enabled: boolean): void {
  demoMode = enabled;
}

function licenseKey(): string {
  return demoMode ? `demo:${REAL_LICENSE_KEY}` : REAL_LICENSE_KEY;
}

function verdictKey(): string {
  return `${licenseKey()}:verdict`;
}

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
}

export function captureReturnedLicense(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(licenseKey(), token.trim());
  localStorage.setItem(verdictKey(), JSON.stringify({ valid: true, checkedAt: 0 } satisfies CachedVerdict));
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function saveLicense(token: string): void {
  localStorage.setItem(licenseKey(), token.trim());
  localStorage.removeItem(verdictKey());
}

export function clearLicense(): void {
  localStorage.removeItem(licenseKey());
  localStorage.removeItem(verdictKey());
}

export function hasOptimisticUnlock(): boolean {
  const token = localStorage.getItem(licenseKey());
  if (!token) return false;
  const raw = localStorage.getItem(verdictKey());
  if (!raw) return true;
  try { return (JSON.parse(raw) as CachedVerdict).valid; } catch { return true; }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason: string }> {
  const token = localStorage.getItem(licenseKey());
  if (!token) return { valid: false, reason: 'missing' };
  const raw = localStorage.getItem(verdictKey());
  if (!force && raw) {
    try {
      const cached = JSON.parse(raw) as CachedVerdict;
      if (Date.now() - cached.checkedAt < DAY) return { valid: cached.valid, reason: 'cached' };
    } catch { /* verify malformed cache */ }
  }
  const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is unavailable. Your notebook still works offline.');
  const result = await response.json() as { valid: boolean; reason: string };
  localStorage.setItem(verdictKey(), JSON.stringify({ valid: result.valid, checkedAt: Date.now() } satisfies CachedVerdict));
  return result;
}
