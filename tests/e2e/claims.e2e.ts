import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function wavBuffer(seconds = 2): Buffer {
  const sampleRate = 8_000;
  const samples = sampleRate * seconds;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + samples * 2, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index += 1) buffer.writeInt16LE(Math.round(Math.sin(index / 10) * 1_200), 44 + index * 2);
  return buffer;
}

async function readStore(page: import('@playwright/test').Page, database: string): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(async (name) => new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('passages')) { db.close(); resolve([]); return; }
      const get = db.transaction('passages').objectStore('passages').getAll();
      get.onsuccess = () => { resolve(get.result); db.close(); };
      get.onerror = () => reject(get.error);
    };
  }), database);
}

test('@claim:demo-no-account opens a useful sample in one click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bach minuet shift · bars 17–20');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('The shift landed when I released thumb pressure before moving.')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
});

test('@claim:offline-reload reopens the sample offline', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bach minuet shift · bars 17–20');
  await expect(page.getByText('Offline · data available')).toBeVisible();
});

test('@claim:local-private keeps demo writes isolated and makes no third-party request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await page.goto('/?demo=1');
  await page.evaluate(async () => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('practice-loop-notebook', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('passages', { keyPath: 'id' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('passages', 'readwrite');
      tx.objectStore('passages').put({ id: 'real-sentinel', title: 'Real data must stay untouched' });
      tx.oncomplete = () => { db.close(); resolve(); };
    };
  }));
  await page.getByRole('button', { name: 'Count one clean pass' }).click();
  await page.getByLabel('Short reflection').fill('Demo-only note.');
  await page.getByRole('button', { name: 'Save session reflection' }).click();
  expect(requests.filter((url) => new URL(url).origin !== new URL(page.url()).origin)).toEqual([]);
  const real = await readStore(page, 'practice-loop-notebook');
  const demo = await readStore(page, 'demo:practice-loop-notebook');
  expect(real).toEqual([{ id: 'real-sentinel', title: 'Real data must stay untouched' }]);
  expect((demo.find((item) => item.id === 'demo-bach-shift')?.sessions as unknown[]).length).toBe(2);
});

test('@claim:local-media stores a selected playable recording as a local Blob', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await page.goto('/demo?archive=1');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Quiet entry · second movement' }).click();
  await page.getByLabel('Passage name').fill('Imported WAV check');
  await page.getByLabel('Your audio or video file').setInputFiles({ name: 'claim.wav', mimeType: 'audio/wav', buffer: wavBuffer() });
  await page.getByRole('button', { name: 'Create loop' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imported WAV check');
  const demo = await readStore(page, 'demo:practice-loop-notebook');
  const imported = demo.find((item) => item.title === 'Imported WAV check');
  expect(imported?.mediaName).toBe('claim.wav');
  expect(await page.evaluate((id) => new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open('demo:practice-loop-notebook');
    request.onsuccess = () => { const db = request.result; const get = db.transaction('passages').objectStore('passages').get(id); get.onsuccess = () => { resolve(get.result.media instanceof Blob); db.close(); }; };
    request.onerror = () => reject(request.error);
  }), imported?.id as string)).toBe(true);
  expect(requests.filter((url) => new URL(url).origin !== new URL(page.url()).origin)).toEqual([]);
});

test('@claim:json-export exports plans and sessions without media', async ({ page }) => {
  await page.goto('/demo?archive=1');
  const download = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export archive' }).click()]);
  const archive = JSON.parse(await readFile((await download[0].path())!, 'utf8'));
  expect(archive.passages).toHaveLength(3);
  expect(archive.passages[0]).toMatchObject({ planMode: 'ramp', targetReps: 6 });
  expect(archive.passages[0].sessions[0]).toMatchObject({ repetitions: 6, confidence: 4 });
  expect(archive.passages.every((passage: Record<string, unknown>) => !('media' in passage))).toBe(true);
});

test('@claim:csv-export exports one row per saved session', async ({ page }) => {
  await page.goto('/demo?archive=1');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv.split('\n')).toHaveLength(2);
  expect(csv).toContain('"Passage","Date","Repetitions","Tempo","Criterion met","Confidence","Reflection"');
  expect(csv).toContain('"Bach minuet shift · bars 17–20"');
});

test('@claim:practice-persistence reloads saved markers speed and plan', async ({ page }) => {
  await page.goto('/demo');
  await page.getByLabel('A · loop starts sec').fill('2.0');
  await page.getByLabel('A · loop starts sec').press('Tab');
  await page.getByLabel('Recording speed').fill('0.75');
  await page.getByRole('button', { name: 'Edit plan' }).click();
  await page.getByLabel('Passes per session').fill('9');
  await page.getByRole('button', { name: 'Save plan' }).click();
  await page.reload();
  await expect(page.getByLabel('A · loop starts sec')).toHaveValue('2.0');
  await expect(page.getByLabel('Recording speed')).toHaveValue('0.75');
  await expect(page.getByText('/ 9')).toBeVisible();
});

test('@claim:plan-modes displays steady ramp and variable plans', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#plan-summary')).toContainText('72');
  await expect(page.locator('#plan-summary')).toContainText('toward 84');
  await page.getByRole('button', { name: /Passage archive/ }).click();
  await page.locator('.passage-open').filter({ hasText: 'Bowing pattern' }).click();
  await expect(page.locator('#plan-summary')).toContainText('92');
  await expect(page.locator('#plan-summary')).toContainText('steady');
  await page.getByRole('button', { name: /Passage archive/ }).click();
  await page.locator('.passage-open').filter({ hasText: 'Quiet entry' }).click();
  await expect(page.locator('#plan-summary')).toContainText('76');
  await expect(page.locator('#plan-summary')).toContainText('variable');
});

test('@claim:session-evidence saves every practice evidence field', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Count one clean pass' }).click();
  await page.getByLabel('Short reflection').fill('Release the thumb before the shift.');
  await page.getByLabel('Confidence').selectOption('5');
  await page.getByLabel('I met today’s exit criterion').check();
  await page.getByRole('button', { name: 'Save session reflection' }).click();
  await expect(page.getByText('Release the thumb before the shift.')).toBeVisible();
  await expect(page.getByText('1 passes · 72 BPM · confidence 5/5')).toBeVisible();
  await expect(page.getByText('✓ criterion met').first()).toBeVisible();
  const demo = await readStore(page, 'demo:practice-loop-notebook');
  expect((demo.find((item) => item.id === 'demo-bach-shift')?.sessions as Array<Record<string, unknown>>)[0]).toMatchObject({ repetitions: 1, bpm: 72, criterionMet: true, confidence: 5, reflection: 'Release the thumb before the shift.' });
});

test('@claim:free-license-boundary enforces three passages and isolates a verified unlock', async ({ page }) => {
  await page.goto('/demo?archive=1');
  await expect(page.locator('.passage-open')).toHaveCount(3);
  await expect(page.getByText('Your free archive is full.')).toBeVisible();
  await page.route('https://api.sociobot.in/api/v1/products/practice-loop-notebook/verify?license=demo-valid', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await page.goto('/unlock?demo=1');
  await page.getByLabel('License token').fill('demo-valid');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('License active on this device')).toBeVisible();
  expect(await page.evaluate(() => ({ demo: localStorage.getItem('demo:sb_license:practice-loop-notebook'), real: localStorage.getItem('sb_license:practice-loop-notebook') }))).toEqual({ demo: 'demo-valid', real: null });
  await page.goto('/demo?archive=1');
  await expect(page.getByRole('heading', { name: 'Create a practice loop' })).toBeVisible();
  await expect(page.getByText('3 · full')).toBeVisible();
});

test('@claim:installable-shell exposes a complete manifest and service worker', async ({ page }) => {
  await page.goto('/demo');
  const manifest = await page.evaluate(async () => fetch('/manifest.webmanifest').then((response) => response.json()));
  expect(manifest).toMatchObject({ name: 'Practice Loop Notebook', display: 'standalone', start_url: '/?v=3' });
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  const registration = await page.evaluate(async () => { const value = await navigator.serviceWorker.ready; return { scope: value.scope, active: Boolean(value.active) }; });
  expect(registration.active).toBe(true);
  expect(registration.scope).toMatch(/\/$/);
});

test('@claim:license-contact sends a token only to the product verification endpoint', async ({ page }) => {
  const crossOrigin: string[] = [];
  page.on('request', (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:4173') crossOrigin.push(request.url()); });
  await page.route('https://api.sociobot.in/api/v1/products/practice-loop-notebook/verify?license=fixture-token', (route) => route.fulfill({ json: { valid: true, reason: 'ok' } }));
  await page.goto('/unlock?demo=1');
  await page.getByLabel('License token').fill('fixture-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('License active on this device')).toBeVisible();
  expect(crossOrigin).toEqual(['https://api.sociobot.in/api/v1/products/practice-loop-notebook/verify?license=fixture-token']);
});
