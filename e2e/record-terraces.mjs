import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const browserCache = resolve('.cache/ms-playwright');
if (existsSync(resolve(browserCache, 'ffmpeg-1013/ffmpeg-win64.exe'))) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= browserCache;
}
const { chromium, expect } = await import('@playwright/test');
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
  args: ['--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: 'artifacts', size: { width: 1280, height: 900 } },
  reducedMotion: 'no-preference',
});
await context.addInitScript(() => localStorage.setItem('portfolio-language', 'es'));
const page = await context.newPage();
const video = page.video();
const errors = [];
const milestones = [];
const started = Date.now();
page.on('pageerror', (error) => errors.push(error.message));
async function milestone(name) {
  const pose = await page.locator('.canvas-host').evaluate((host) => ({ ...host.dataset }));
  milestones.push({ name, second: (Date.now() - started) / 1000, pose });
}
try {
  await page.goto('http://127.0.0.1:4200/');
  await page.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();
  const stage = page.locator('.journey-stage');
  const host = page.locator('.canvas-host');
  await expect(stage).toHaveClass(/is-ready/);
  await expect(host).toHaveAttribute('data-scene-state', 'idle');
  await milestone('plaza');
  await page.waitForTimeout(700);
  for (const level of [1, 2]) {
    await stage.getByRole('button', { name: `Terraza ${level}`, exact: true }).click();
    await expect(stage).toHaveAttribute('data-level', String(level), { timeout: 25000 });
    await expect(host).toHaveAttribute('data-scene-state', 'idle', { timeout: 25000 });
    await milestone(`terraza-${level}`);
    await page.waitForTimeout(900);
  }
  await stage.getByRole('button', { name: 'Visitar Laboratorio RGB', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Laboratorio RGB', exact: true })).toBeVisible();
  await milestone('ficha-rgb');
  await page.waitForTimeout(1600);
  await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  await stage.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await expect(stage).toHaveAttribute('data-level', '0', { timeout: 25000 });
  await expect(host).toHaveAttribute('data-scene-state', 'idle', { timeout: 25000 });
  await milestone('regreso-plaza');
  await page.waitForTimeout(900);
  assert.deepEqual(errors, []);
} finally {
  await context.close();
  if (video) {
    const original = await video.path();
    const output = resolve('artifacts/recorrido-terrazas.webm');
    await video.saveAs(output);
    if (resolve(original) !== output) await unlink(original);
  }
  await browser.close();
}
await writeFile(
  'artifacts/recorrido-terrazas.json',
  JSON.stringify({ errors, milestones }, null, 2),
);
console.log('Grabación real: artifacts/recorrido-terrazas.webm');
