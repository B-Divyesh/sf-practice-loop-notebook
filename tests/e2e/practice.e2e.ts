import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

test('has no serious accessibility violations on core and legal views', async ({ page }) => {
  for (const path of ['/', '/privacy', '/terms', '/unlock']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('reloads the installed shell while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Turn a tricky few seconds');
  await expect(page.locator('.offline')).toHaveText('Offline · saved locally');
});
