import { test, expect, type Locator, type Page } from '@playwright/test';

const upperProjects = [
  {
    id: 'riego',
    name: 'Sistema de Riego',
    repository: 'Sistema_Riego-IA',
    level: 1,
    description: 'Simulador de apoyo al riego',
    tags: ['Python', 'Streamlit', 'Lógica difusa'],
  },
  {
    id: 'agropay',
    name: 'AgroPay',
    repository: 'AgroPay',
    level: 1,
    description: 'Aplicación que conecta agricultores',
    tags: ['React Native 0.81', 'Express 4', 'MongoDB'],
  },
  {
    id: 'rgb',
    name: 'Laboratorio RGB',
    repository: 'Laboratorio-rgb',
    level: 2,
    description: 'analizar y transformar imágenes',
    tags: ['Python', 'OpenCV', 'PySide6'],
  },
  {
    id: 'novacore',
    name: 'Novacore',
    repository: 'Novacore',
    level: 2,
    description: 'Sitio web colaborativo',
    tags: ['Angular 20', 'TypeScript'],
  },
  {
    id: 'vinculacion',
    name: 'Vinculación',
    repository: 'Vinculacion-Sistema-Riego',
    level: 1,
    description: 'Sistema IoT de monitoreo agrícola',
    tags: ['Next.js 14', 'Java 21 / Spring Boot 4', 'ESP32'],
  },
  {
    id: 'pantufladas',
    name: 'Pantufladas',
    repository: 'Pantufladas',
    level: 3,
    description: 'Sistema de gestión para una fábrica de pantuflas',
    tags: ['Angular 20', 'Express 4', 'Prisma 5', 'PostgreSQL'],
  },
] as const;

type Pose = { x: number; y: number; z: number; cameraZ: number };

async function pose(host: Locator): Promise<Pose> {
  return host.evaluate((element) => ({
    x: Number((element as HTMLElement).dataset['robotX']),
    y: Number((element as HTMLElement).dataset['robotY']),
    z: Number((element as HTMLElement).dataset['robotZ']),
    cameraZ: Number((element as HTMLElement).dataset['cameraTargetZ']),
  }));
}

async function enterMap(page: Page): Promise<{ stage: Locator; host: Locator }> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();
  const stage = page.locator('.journey-stage');
  const host = stage.locator('.canvas-host');
  await expect(stage).toHaveClass(/is-ready/);
  await expect(host).toHaveAttribute('data-robot-y', /\d/);
  await expect(stage).toBeInViewport({ ratio: 0.995 });
  const bounds = await stage.evaluate((element) => ({
    rect: element.getBoundingClientRect().toJSON(),
    width: innerWidth,
    height: innerHeight,
  }));
  expect(bounds.rect.left).toBeGreaterThanOrEqual(-1);
  expect(bounds.rect.top).toBeGreaterThanOrEqual(-1);
  expect(bounds.rect.right).toBeLessThanOrEqual(bounds.width + 1);
  expect(bounds.rect.bottom).toBeLessThanOrEqual(bounds.height + 1);
  return { stage, host };
}

async function expectVisiblePins(stage: Locator, names: readonly string[]): Promise<void> {
  const pins = stage.locator('.station-pin:visible');
  await expect(pins).toHaveCount(names.length);
  for (const name of names) {
    const pin = stage.getByRole('button', { name: `Visitar ${name}`, exact: true });
    await expect(pin).toBeInViewport({ ratio: 1 });
    const geometry = await pin.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const stage = element.closest('.journey-stage')!.getBoundingClientRect();
      return { rect: rect.toJSON(), stage: stage.toJSON() };
    });
    expect(geometry.rect.left).toBeGreaterThanOrEqual(geometry.stage.left - 1);
    expect(geometry.rect.top).toBeGreaterThanOrEqual(geometry.stage.top - 1);
    expect(geometry.rect.right).toBeLessThanOrEqual(geometry.stage.right + 1);
    expect(geometry.rect.bottom).toBeLessThanOrEqual(geometry.stage.bottom + 1);
  }
}

async function visitLevel(
  page: Page,
  stage: Locator,
  host: Locator,
  level: 1 | 2 | 3,
): Promise<Pose[]> {
  await stage
    .getByRole('button', { name: level === 3 ? 'Cima' : `Terraza ${level}`, exact: true })
    .click();
  const samples: Pose[] = [];
  const started = Date.now();
  do {
    samples.push(await pose(host));
    if (
      (await stage.getAttribute('data-level')) === String(level) &&
      (await host.getAttribute('data-scene-state')) === 'idle'
    )
      break;
    await page.waitForTimeout(100);
  } while (Date.now() - started < 25000);
  await expect(stage).toHaveAttribute('data-level', String(level));
  await expect(host).toHaveAttribute('data-scene-state', 'idle');
  return samples;
}

async function expectUpperSheet(
  page: Page,
  project: (typeof upperProjects)[number],
): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: new RegExp(project.name) })).toBeVisible();
  await dialog.locator('.sheet-preview img').evaluate((image: HTMLImageElement) => image.decode());
  await expect(dialog.getByRole('link', { name: 'Ver código', exact: false })).toHaveAttribute(
    'href',
    `https://github.com/Leo538/${project.repository}`,
  );
  await expect(dialog.getByRole('tab', { name: 'Actividad', exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
  const sections = dialog.getByRole('group', { name: 'Secciones de información' });
  const hasSections = await sections.isVisible();
  if (hasSections) await sections.getByRole('button', { name: 'Resumen', exact: true }).click();
  await expect(dialog.locator('.project-full-description')).toContainText(project.description);
  if (hasSections) await sections.getByRole('button', { name: 'Mi aporte', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Mi aporte', exact: true })).toBeVisible();
  if (hasSections) await sections.getByRole('button', { name: 'Tecnologías', exact: true }).click();
  for (const tag of project.tags)
    await expect(dialog.locator('.project-stack').getByText(tag, { exact: true })).toBeVisible();
  // Leave the default gallery view selected for reopening and screenshots.
  await dialog.getByRole('tab', { name: 'Proyecto', exact: true }).click();
}

async function walkTo(page: Page, host: Locator, x: number, z: number): Promise<void> {
  const held = new Set<string>();
  const started = Date.now();
  try {
    while (Date.now() - started < 12000) {
      const current = await pose(host);
      expect(Number.isFinite(current.x) && Number.isFinite(current.z)).toBe(true);
      const dx = x - current.x;
      const dz = z - current.z;
      if (Math.hypot(dx, dz) < 0.25) return;
      const desired = new Set<string>();
      if (Math.abs(dx) > 0.12) desired.add(dx > 0 ? 'd' : 'a');
      if (Math.abs(dz) > 0.12) desired.add(dz < 0 ? 'w' : 's');
      for (const key of held) {
        if (!desired.has(key)) {
          await page.keyboard.up(key);
          held.delete(key);
        }
      }
      for (const key of desired) {
        if (!held.has(key)) {
          await page.keyboard.down(key);
          held.add(key);
        }
      }
      await page.waitForTimeout(45);
    }
    const final = await pose(host);
    throw new Error(
      `El robot no pudo caminar hasta (${x}, ${z}); quedó en (${final.x}, ${final.z}).`,
    );
  } finally {
    for (const key of held) await page.keyboard.up(key);
  }
}

test('WASD sube las tres rampas y E abre proyectos en las terrazas y en la cima', async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const { stage, host } = await enterMap(page);
  const base = await pose(host);
  // Follow the visible ramp centreline using keyboard events, not scene methods or teleports.
  const lowerRamp = [
    [3, 4.35],
    [3, 0.8],
    [3, -2.5],
    [3.15, -4],
    [4.5, -6],
    [6, -7.3],
    [6, -8.4],
    [3, -9.3],
    [-0.5, -9.7],
  ];
  for (const [x, z] of lowerRamp) await walkTo(page, host, x, z);
  await expect(stage).toHaveAttribute('data-level', '1');
  expect((await pose(host)).y).toBeGreaterThan(base.y + 2);
  expect((await pose(host)).cameraZ).toBeLessThan(base.cameraZ - 4);
  await page.keyboard.press('e');
  await expectUpperSheet(page, upperProjects[0]);
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  const upperRamp = [
    [3, -9.3],
    [3, -12.6],
    [0, -14.2],
    [-1.5, -16.5],
    [0.8, -18.1],
    [1, -18.7],
    [-3.5, -19.15],
  ];
  for (const [x, z] of upperRamp) await walkTo(page, host, x, z);
  await expect(stage).toHaveAttribute('data-level', '2');
  expect((await pose(host)).y).toBeGreaterThan(base.y + 4);
  await page.keyboard.press('e');
  await expectUpperSheet(page, upperProjects[2]);
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  const summitRamp = [
    [1, -18.7],
    [1, -23.7],
    [0.6, -25.2],
    [-1.2, -27.1],
    [0.1, -29.1],
    [1.3, -30.6],
    [1.3, -31.7],
  ];
  for (const [x, z] of summitRamp) await walkTo(page, host, x, z);
  await expect(stage).toHaveAttribute('data-level', '3');
  expect((await pose(host)).y).toBeGreaterThan(base.y + 7);
  expect((await pose(host)).cameraZ).toBeLessThan(base.cameraZ - 25);
  await page.keyboard.press('e');
  await expectUpperSheet(page, upperProjects[5]);
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  await stage.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await expect(stage).toHaveAttribute('data-level', '0', { timeout: 25000 });
  await expect(host).toHaveAttribute('data-scene-state', 'idle', { timeout: 25000 });
  expect((await pose(host)).y).toBeCloseTo(base.y, 1);
});

test('subir a las terrazas, visitar cinco edificios y regresar a la plaza', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { stage, host } = await enterMap(page);
  const base = await pose(host);
  await expect(stage).toHaveAttribute('data-level', '0');
  await expectVisiblePins(stage, ['FinanSmart', 'SICOP', 'ChatQuality']);
  await stage.screenshot({ path: `artifacts/terrazas-plaza-${testInfo.project.name}.png` });

  let previous = base;
  for (const level of [1, 2] as const) {
    const samples = await visitLevel(page, stage, host, level);
    const arrived = await pose(host);
    expect(arrived.y).toBeGreaterThan(previous.y + 1);
    expect(arrived.z).toBeLessThan(previous.z - 4);
    expect(arrived.cameraZ).toBeLessThan(previous.cameraZ - 3);
    expect(
      samples.some((sample) => sample.y > previous.y + 0.25 && sample.y < arrived.y - 0.25),
    ).toBe(true);
    expect(
      samples.some(
        (sample) =>
          sample.cameraZ < previous.cameraZ - 0.3 && sample.cameraZ > arrived.cameraZ + 0.3,
      ),
    ).toBe(true);
    for (let index = 1; index < samples.length; index++) {
      expect(Math.abs(samples[index].y - samples[index - 1].y)).toBeLessThan(1.4);
      expect(Math.abs(samples[index].cameraZ - samples[index - 1].cameraZ)).toBeLessThan(5);
    }
    const projects = upperProjects.filter((project) => project.level === level);
    await expectVisiblePins(
      stage,
      projects.map((project) => project.name),
    );
    await stage.screenshot({ path: `artifacts/terraza-${level}-${testInfo.project.name}.png` });
    for (const project of projects) {
      const pin = stage.getByRole('button', { name: `Visitar ${project.name}`, exact: true });
      if (testInfo.project.name === 'mobile') await pin.tap();
      else await pin.click();
      await expectUpperSheet(page, project);
      await page.screenshot({
        path: `artifacts/ficha-terraza-${project.id}-${testInfo.project.name}.png`,
      });
      const beforeClose = await pose(host);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Cerrar ficha', exact: true })
        .click();
      await expect(stage).toHaveAttribute('data-current-stop', project.id);
      await expect(stage).toHaveAttribute('data-level', String(level));
      expect((await pose(host)).y).toBeCloseTo(beforeClose.y, 1);
      await stage.getByRole('button', { name: `Abrir ${project.name}`, exact: false }).click();
      await expectUpperSheet(page, project);
      await page.keyboard.press('Escape');
    }
    previous = await pose(host);
  }
  await stage.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await expect(stage).toHaveAttribute('data-level', '0', { timeout: 25000 });
  await expect(host).toHaveAttribute('data-scene-state', 'idle', { timeout: 25000 });
  expect((await pose(host)).y).toBeCloseTo(base.y, 1);
  await expectVisiblePins(stage, ['FinanSmart', 'SICOP', 'ChatQuality']);
  const frames = await host.getAttribute('data-render-frames');
  await page.waitForTimeout(800);
  expect(await host.getAttribute('data-render-frames')).toBe(frames);
  expect(errors).toEqual([]);
});

test('las seis fichas de las terrazas y la cima conservan sus datos sin depender de WebGL', async ({
  page,
}) => {
  await page.route('**/*journey-scene*', (route) => route.abort());
  for (const project of upperProjects) {
    await page.goto(`/?proyecto=${project.id}#mapa`);
    await expectUpperSheet(page, project);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cerrar ficha', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.locator('.site-header').scrollIntoViewIfNeeded();
  const toggle = page.locator('.menu-toggle');
  if (await toggle.isVisible()) await toggle.click();
  await page.locator('.project-navigation > summary').click();
  const nav = page.getByRole('navigation', { name: 'Menú principal' });
  for (const name of [
    'FinanSmart',
    'SICOP',
    'ChatQuality',
    ...upperProjects.map((project) => project.name),
  ]) {
    await expect(nav.getByRole('link', { name, exact: false })).toBeVisible();
  }
});

test('nueve paradas 3+3+2+1 coronan la cima tras ocho visitas y permiten volver a la plaza', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { stage, host } = await enterMap(page);
  const base = await pose(host);
  await expect(stage).toHaveAttribute('data-visited-count', '0');
  await expect(stage).toHaveAttribute('data-journey-complete', 'false');
  await expect(host).toHaveAttribute('data-summit-awarded', 'false');
  await expect(
    stage.getByRole('group', { name: 'Niveles del mapa' }).getByRole('button'),
  ).toHaveCount(4);

  // The featured project stays available before completing the journey.
  await visitLevel(page, stage, host, 3);
  await expectVisiblePins(stage, ['Pantufladas']);
  expect((await pose(host)).y).toBeCloseTo(8.6, 1);
  await stage.getByRole('button', { name: 'Visitar Pantufladas', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Pantufladas', exact: true }),
  ).toBeVisible();
  await expect(stage).toHaveAttribute('data-visited-count', '0');
  await expect(host).toHaveAttribute('data-summit-awarded', 'false');
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha', exact: true }).click();

  const levelStops = [
    [
      { id: 'finansmart', name: 'FinanSmart' },
      { id: 'sicop', name: 'SICOP' },
      { id: 'chatquality', name: 'ChatQuality' },
    ],
    [
      { id: 'vinculacion', name: 'Vinculación' },
      { id: 'riego', name: 'Sistema de Riego' },
      { id: 'agropay', name: 'AgroPay' },
    ],
    [
      { id: 'rgb', name: 'Laboratorio RGB' },
      { id: 'novacore', name: 'Novacore' },
    ],
  ];
  let visited = 0;
  for (const level of [0, 1, 2] as const) {
    if (level === 0) {
      await stage.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
      await expect(stage).toHaveAttribute('data-level', '0');
    } else await visitLevel(page, stage, host, level);
    const stops = levelStops[level];
    await expectVisiblePins(
      stage,
      stops.map((stop) => stop.name),
    );
    for (const stop of stops) {
      const pin = stage.getByRole('button', { name: `Visitar ${stop.name}`, exact: true });
      if (testInfo.project.name === 'mobile') await pin.tap();
      else await pin.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: new RegExp(stop.name) })).toBeVisible();
      await dialog
        .locator('.sheet-preview img')
        .evaluate((image: HTMLImageElement) => image.decode());
      await expect(dialog.getByRole('tab', { name: 'Información', exact: true })).toBeVisible();
      await expect(dialog.getByRole('tab', { name: 'Actividad', exact: true })).toBeVisible();
      await expect(dialog.locator('.project-code-link:visible')).toHaveAttribute(
        'href',
        /^https:\/\/github\.com\/Leo538\//,
      );
      await expect(stage).toHaveAttribute('data-visited-count', String(++visited));
      const beforeClose = await pose(host);
      await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
      await expect(stage).toHaveAttribute('data-current-stop', stop.id);
      const afterClose = await pose(host);
      expect(afterClose.x).toBeCloseTo(beforeClose.x, 2);
      expect(afterClose.y).toBeCloseTo(beforeClose.y, 2);
      expect(afterClose.z).toBeCloseTo(beforeClose.z, 2);
    }
    const levelButton = stage.getByRole('button', {
      name: level === 0 ? 'Plaza' : `Terraza ${level}`,
      exact: true,
    });
    await expect(levelButton).toHaveClass(/level-complete/);
  }
  await expect(stage).toHaveAttribute('data-visited-count', '8');
  await expect(stage).toHaveAttribute('data-journey-complete', 'true');
  await expect(host).toHaveAttribute('data-summit-awarded', 'true');
  await expect(stage.locator('.journey-progress')).toContainText('Niveles completados');
  await visitLevel(page, stage, host, 3);
  await expectVisiblePins(stage, ['Pantufladas']);
  await expect(stage.locator('.featured-stop')).toContainText('★');
  await expect(stage.getByRole('button', { name: 'Cima', exact: true })).toHaveClass(
    /level-complete/,
  );
  await stage.screenshot({ path: `artifacts/cima-coronada-${testInfo.project.name}.png` });
  const featuredPin = stage.getByRole('button', { name: 'Visitar Pantufladas', exact: true });
  if (testInfo.project.name === 'mobile') await featuredPin.tap();
  else await featuredPin.click();
  await expect(page.getByRole('dialog').locator('.featured-project-label')).toContainText(
    'Proyecto estrella',
  );
  await page.screenshot({ path: `artifacts/ficha-pantufladas-${testInfo.project.name}.png` });
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  await stage.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await expect(stage).toHaveAttribute('data-level', '0');
  await expect(host).toHaveAttribute('data-scene-state', 'idle');
  expect((await pose(host)).y).toBeCloseTo(base.y, 1);
  await expectVisiblePins(stage, ['FinanSmart', 'SICOP', 'ChatQuality']);
  const frames = await host.getAttribute('data-render-frames');
  await page.waitForTimeout(500);
  expect(await host.getAttribute('data-render-frames')).toBe(frames);
  expect(errors).toEqual([]);
});

test('el texto animado reserva espacio para cada frase en español e inglés', async ({
  page,
}, testInfo) => {
  test.setTimeout(70000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/*journey-scene*', (route) => route.abort());
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const writer = page.getByTestId('hero-typewriter');
  const text = writer.locator('.typed-text');
  await expect(writer).toBeVisible();
  let baseline = await page
    .locator('.hero-intro, .hero-actions')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
  const verifyPhrase = async (index: number, phrase: string, screenshot?: string) => {
    await expect
      .poll(
        async () => ({
          index: await writer.getAttribute('data-phrase'),
          state: await writer.getAttribute('data-state'),
        }),
        { timeout: 22000 },
      )
      .toEqual({ index: String(index), state: 'holding' });
    await expect(text).toHaveText(phrase);
    const stable = await page
      .locator('.hero-intro, .hero-actions')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
    stable.forEach((y, position) =>
      expect(Math.abs(y - baseline[position])).toBeLessThanOrEqual(1),
    );
    const fits = await text.evaluate((element) => {
      const frame = element.closest('app-hero-typewriter')!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].every(
        (rect) =>
          rect.left >= frame.left - 2 &&
          rect.right <= frame.right + 2 &&
          rect.top >= frame.top - 2 &&
          rect.bottom <= frame.bottom + 2,
      );
    });
    expect(fits).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (screenshot) await page.screenshot({ path: screenshot });
  };
  await verifyPhrase(0, 'Desarrollador full stack');
  await verifyPhrase(
    1,
    'Estudiante de Ingeniería de Software',
    `artifacts/frase-larga-${testInfo.project.name}.png`,
  );
  await verifyPhrase(2, 'C#/.NET · Angular · SQL');
  const header = page.locator('.site-header');
  const toggle = header.locator('.menu-toggle');
  if (await toggle.isVisible()) await toggle.click();
  await header.getByRole('button', { name: 'English', exact: true }).click();
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'true')
    await toggle.click();
  await expect
    .poll(
      async () => ({
        index: await writer.getAttribute('data-phrase'),
        state: await writer.getAttribute('data-state'),
      }),
      { timeout: 6000 },
    )
    .toEqual({ index: '0', state: 'holding' });
  await expect(text).toHaveText('Full-stack developer');
  await expect
    .poll(
      async () => ({
        index: await writer.getAttribute('data-phrase'),
        state: await writer.getAttribute('data-state'),
      }),
      { timeout: 12000 },
    )
    .toEqual({ index: '1', state: 'holding' });
  await expect(text).toHaveText('Software Engineering student');
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 740 });
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    await header.getByRole('button', { name: 'Español', exact: true }).click();
    if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    baseline = await page
      .locator('.hero-intro, .hero-actions')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
    await verifyPhrase(
      1,
      'Estudiante de Ingeniería de Software',
      'artifacts/frase-larga-mobile-320.png',
    );
  }
});

test('movimiento reducido mantiene completa la primera frase y permite cambiar idioma', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const writer = page.getByTestId('hero-typewriter');
  await expect(writer).toHaveAttribute('data-state', 'static');
  await expect(writer.locator('.typed-text')).toHaveText('Desarrollador full stack');
  await page.waitForTimeout(400);
  await expect(writer).toHaveAttribute('data-phrase', '0');
  const toggle = page.locator('.menu-toggle');
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(writer).toHaveAttribute('data-state', 'static');
  await expect(writer.locator('.typed-text')).toHaveText('Full-stack developer');
});
