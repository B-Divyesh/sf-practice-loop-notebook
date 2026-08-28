import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function wavBuffer(seconds = 2): Buffer {
  const sampleRate = 8000;
  const samples = sampleRate * seconds;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i += 1) buffer.writeInt16LE(Math.round(Math.sin(i / 10) * 1200), 44 + i * 2);
  return buffer;
}

test('creates a playable passage and saves a practice reflection', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Practice Loop Notebook/);
  await page.getByLabel('Passage name').fill('Four-note bridge run');
  await page.getByLabel('Your audio or video file').setInputFiles({ name: 'bridge.wav', mimeType: 'audio/wav', buffer: wavBuffer() });
  await page.getByRole('button', { name: 'Create loop' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Four-note bridge run');
  await page.getByRole('button', { name: 'Count one clean pass' }).click();
  await page.getByLabel('Short reflection').fill('Lighter thumb made the shift land.');
  await page.getByLabel('I met today’s exit criterion').check();
  await page.getByRole('button', { name: 'Save session reflection' }).click();
  await expect(page.getByText('Lighter thumb made the shift land.')).toBeVisible();
  await page.getByRole('button', { name: 'Passage archive' }).click();
  await expect(page.locator('.passage-open').filter({ hasText: 'Four-note bridge run' })).toContainText('1 session');
});

test('has no serious accessibility violations on core, demo, legal, and error views', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/unlock', '/not-a-route']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('reloads the installed shell while offline', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bach minuet shift');
  await expect(page.locator('.offline')).toHaveText('Offline · data available');
});

test('rejects a malformed archive before it reaches IndexedDB', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Import archive').setInputFiles({
    name: 'malformed.json', mimeType: 'application/json',
    buffer: Buffer.from('{"product":"practice-loop-notebook","version":1,"passages":[{"id":"malformed-passage","title":"Malformed archive record","sessions":[],"updatedAt":"2026-08-28T00:00:00.000Z"}]}'),
  });
  await expect(page.getByRole('status').filter({ hasText: 'Archive rejected' })).toContainText('No data was imported');
  await expect(page.getByText('Malformed archive record')).toHaveCount(0);
  expect(await page.evaluate(async () => new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open('practice-loop-notebook');
    request.onsuccess = () => { const db = request.result; const get = db.transaction('passages').objectStore('passages').get('malformed-passage'); get.onsuccess = () => { resolve(Boolean(get.result)); db.close(); }; };
    request.onerror = () => reject(request.error);
  }))).toBe(false);
});

test('updates route titles, heading focus, history, and unknown-route recovery', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Archive limit', exact: true }).click();
  await expect(page).toHaveTitle('Archive limit — Practice Loop Notebook');
  await expect(page.locator('h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveTitle('Practice Loop Notebook — Loop Musical Passages');
  await expect(page.locator('h1')).toBeFocused();
  await page.goto('/not-a-route');
  await expect(page).toHaveTitle('Page not found — Practice Loop Notebook');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Return to the notebook' })).toBeVisible();
});

test('discards every demo namespace when starting for real', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => {
    localStorage.setItem('demo:sb_license:practice-loop-notebook', 'fixture-demo-token');
    localStorage.setItem('sb_license:practice-loop-notebook', 'real-license-must-remain');
  });
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const hasDemoStore = databases.some((database) => database.name === 'demo:practice-loop-notebook');
    return {
      hasDemoStore,
      demoLicense: localStorage.getItem('demo:sb_license:practice-loop-notebook'),
      realLicense: localStorage.getItem('sb_license:practice-loop-notebook'),
    };
  })).toEqual({ hasDemoStore: false, demoLicense: null, realLicense: 'real-license-must-remain' });
});

test('serves complete social metadata for the designed 404 and unknown paths', async ({ page, request }) => {
  const notFoundSource = await readFile('404.html', 'utf8');
  expect(notFoundSource).toContain('property="og:title" content="Page not found — Practice Loop Notebook"');
  expect(notFoundSource).toContain('property="og:description"');
  expect(notFoundSource).toContain('property="og:image" content="https://practice-loop-notebook.sociobot.in/assets/social-preview.20260828.webp"');
  expect(notFoundSource).toContain('name="twitter:card" content="summary_large_image"');
  expect(notFoundSource).toContain('name="twitter:title" content="Page not found — Practice Loop Notebook"');
  expect(notFoundSource).toContain('name="twitter:description"');
  expect(notFoundSource).toContain('name="twitter:image" content="https://practice-loop-notebook.sociobot.in/assets/social-preview.20260828.webp"');
  for (const path of ['/404', '/not-a-route']) {
    const response = await request.get(path);
    // Vite's local preview deliberately answers SPA fallbacks with 200; Static
    // Web Apps returns the configured 404 response in deployed verification.
    expect(response.status()).toBe(process.env.PLAYWRIGHT_BASE_URL ? 404 : 200);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  }
});

test('keeps the full first action and controls usable at 390 px', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Practice hard musical passages with a loop.');
  await expect(page.getByText('For instrumentalists learning a few difficult seconds from their own recording.')).toBeVisible();
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  for (const link of await page.locator('.site-header nav a').all()) {
    const target = await link.boundingBox();
    expect(target?.height).toBeGreaterThanOrEqual(44);
  }
});
