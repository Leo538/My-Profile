import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const localBrowserCache = resolve('.cache/ms-playwright');
const localFfmpeg = resolve(localBrowserCache, 'ffmpeg-1013/ffmpeg-win64.exe');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localFfmpeg)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowserCache;
}
const { chromium, devices } = await import('@playwright/test');

const outputDirectory = resolve('artifacts');
const recordingPath = resolve(outputDirectory, 'recorrido-dos-paradas.webm');
const sourcePath = resolve('.cache/recorrido-source.webm');
await mkdir(outputDirectory, { recursive: true });
await mkdir('.cache', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
  args: ['--enable-unsafe-swiftshader'],
});
const errors = [];
const milestones = [];
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: outputDirectory, size: { width: 1280, height: 900 } },
  reducedMotion: 'no-preference',
});
await context.addInitScript(() => localStorage.setItem('portfolio-language', 'es'));
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const video = page.video();
const startedAt = Date.now();
let recordingError;
let mapStarted = 0;
let finishedAt = 0;
const moment = () => (Date.now() - startedAt) / 1000;

async function waitForArtwork(target) {
  await target.evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = Array.from(document.images).filter((image) => {
      const bounds = image.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
    });
    await Promise.all(
      visibleImages.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }),
    );
  });
  assert.equal(await target.locator('vite-error-overlay').count(), 0);
}

async function waitForSignature(target) {
  await target
    .locator('.signature .signature-tail')
    .evaluate((tail) => Promise.all(tail.getAnimations().map((animation) => animation.finished)));
}

try {
  await page.goto('http://127.0.0.1:4200/');
  await waitForArtwork(page);
  await waitForSignature(page);
  await page.waitForTimeout(600);
  await page.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();
  await page.locator('.journey-stage.is-ready').waitFor();
  await page.waitForTimeout(900);
  mapStarted = moment();

  for (const project of ['FinanSmart', 'SICOP']) {
    const pin = page.getByRole('button', { name: `Visitar ${project}`, exact: true });
    await pin.hover();
    await page.waitForTimeout(350);
    const walkingStarted = moment();
    await pin.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByRole('heading', { name: project, exact: true }).waitFor();
    const arrived = moment();
    milestones.push({
      kind: `walk-${project.toLowerCase()}`,
      second: (walkingStarted + arrived) / 2,
    });
    await waitForArtwork(page);
    await page.waitForTimeout(1000);
    await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
    if (project === 'FinanSmart') {
      await dialog.getByRole('button', { name: 'Alemana', exact: true }).click();
    } else {
      await dialog.getByRole('button', { name: /Pasar a revisi/ }).click();
    }
    await page.waitForTimeout(1300);
    milestones.push({ kind: `sheet-${project.toLowerCase()}`, second: (arrived + moment()) / 2 });
    await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
    await page.locator('.journey-stage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
  }
  await page.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await page.waitForTimeout(Math.max(1400, 22000 - (Date.now() - startedAt - mapStarted * 1000)));
  assert.deepEqual(errors, []);
  finishedAt = moment();
} catch (error) {
  recordingError = error;
} finally {
  await context.close();
  if (video) {
    const original = await video.path();
    await video.saveAs(sourcePath);
    if (resolve(original) !== sourcePath) await unlink(original);
    if (!recordingError) {
      const probe = await browser.newPage();
      await probe.goto(pathToFileURL(sourcePath).href);
      await probe.waitForFunction(
        () => Number.isFinite(document.querySelector('video')?.duration),
        undefined,
        { timeout: 15000 },
      );
      const sourceDuration = await probe.locator('video').evaluate((element) => element.duration);
      await probe.context().close();
      const recordingOffset = sourceDuration - finishedAt;
      const trimStarted = Math.max(0, mapStarted + recordingOffset - 0.9);
      const ffmpeg = existsSync(localFfmpeg)
        ? localFfmpeg
        : resolve(process.env.LOCALAPPDATA || '', 'ms-playwright/ffmpeg-1013/ffmpeg-win64.exe');
      await promisify(execFile)(ffmpeg, [
        '-y',
        '-loglevel',
        'error',
        '-ss',
        String(trimStarted),
        '-i',
        sourcePath,
        '-t',
        String(sourceDuration - trimStarted),
        '-an',
        '-c:v',
        'libvpx-vp9',
        '-deadline',
        'realtime',
        '-cpu-used',
        '5',
        '-b:v',
        '2200k',
        recordingPath,
      ]);
      milestones.forEach((milestone) => (milestone.second += recordingOffset - trimStarted));
    }
    console.log(JSON.stringify({ stage: 'recorded', path: recordingPath, frames: milestones }));
  }
}

try {
  if (recordingError) throw recordingError;
  const desktop = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    reducedMotion: 'no-preference',
  });
  await desktop.addInitScript(() => localStorage.setItem('portfolio-language', 'es'));
  const desktopPage = await desktop.newPage();
  desktopPage.on('pageerror', (error) => errors.push(error.message));
  await desktopPage.goto('http://127.0.0.1:4200/');
  await desktopPage.locator('.journey-stage.is-ready').waitFor();
  await waitForSignature(desktopPage);
  for (const image of await desktopPage.locator('img').all()) await image.scrollIntoViewIfNeeded();
  await waitForArtwork(desktopPage);
  await desktopPage.evaluate(() => scrollTo(0, 0));
  await desktopPage.screenshot({ path: `${outputDirectory}/portada-final-desktop.png` });
  await desktopPage.screenshot({
    path: `${outputDirectory}/pagina-completa-final-desktop.png`,
    fullPage: true,
  });
  await desktopPage
    .locator('#mapa')
    .screenshot({ path: `${outputDirectory}/mapa-final-desktop.png` });
  await desktopPage.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).click();
  const finalSheet = desktopPage.getByRole('dialog');
  await finalSheet.waitFor();
  await waitForArtwork(desktopPage);
  assert.equal(await finalSheet.getByRole('combobox').inputValue(), '12');
  await finalSheet.screenshot({ path: `${outputDirectory}/ficha-final-desktop.png` });
  await finalSheet.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  await desktopPage.getByRole('button', { name: 'English', exact: true }).click();
  await desktopPage.locator('html[lang="en"]').waitFor();
  await desktopPage
    .locator('.site-header')
    .screenshot({ path: `${outputDirectory}/cabecera-english.png` });
  assert.equal(
    await desktopPage
      .locator('.site-header')
      .getByRole('link', { name: /GitHub|LinkedIn/ })
      .count(),
    0,
  );
  await desktopPage.getByRole('button', { name: 'Español', exact: true }).click();
  await desktopPage.locator('html[lang="es"]').waitFor();
  await desktop.close();

  const mobile = await browser.newContext({
    ...devices['Pixel 7'],
    reducedMotion: 'no-preference',
  });
  await mobile.addInitScript(() => localStorage.setItem('portfolio-language', 'es'));
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', (error) => errors.push(error.message));
  await mobilePage.goto('http://127.0.0.1:4200/');
  await waitForSignature(mobilePage);
  await mobilePage.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();
  await mobilePage.locator('.journey-stage.is-ready').waitFor();
  await waitForArtwork(mobilePage);
  await mobilePage
    .locator('#mapa')
    .screenshot({ path: `${outputDirectory}/mapa-final-mobile.png` });
  await mobile.close();
  console.log(JSON.stringify({ stage: 'screenshots-complete' }));

  const playback = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const preview = await playback.newPage();
  await preview.goto(pathToFileURL(recordingPath).href);
  await preview.waitForFunction(() => {
    const player = document.querySelector('video');
    return player && Number.isFinite(player.duration) && player.duration > 0;
  });
  const player = preview.locator('video');
  await player.evaluate((element) => element.pause());
  const metadata = await player.evaluate((element) => ({
    duration: element.duration,
    width: element.videoWidth,
    height: element.videoHeight,
  }));
  assert.equal(metadata.width, 1280);
  assert.equal(metadata.height, 900);
  assert.ok(metadata.duration >= 20);
  for (const milestone of milestones) {
    await player.evaluate(async (element, timestamp) => {
      element.pause();
      const decoded = new Promise((done) => element.requestVideoFrameCallback(done));
      const seeked = new Promise((done) =>
        element.addEventListener('seeked', done, { once: true }),
      );
      element.currentTime = Math.min(timestamp, element.duration - 0.15);
      await seeked;
      await Promise.race([
        decoded,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Video frame decoding timed out')), 5000),
        ),
      ]);
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, milestone.second);
    await player.screenshot({ path: `.cache/video-qa-${milestone.kind}.png` });
    console.log(JSON.stringify({ stage: 'frame-reviewed', ...milestone }));
  }
  const file = await stat(recordingPath);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      path: recordingPath,
      bytes: file.size,
      ...metadata,
      frames: milestones,
      browserErrors: errors,
    }),
  );
  await playback.close();
} finally {
  await browser.close();
}
