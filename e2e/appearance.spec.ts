import { test, expect, type Page } from '@playwright/test';

async function showAppearance(page: Page): Promise<void> {
  const selector = page.locator('.theme-switch');
  if (!(await selector.isVisible())) await page.locator('.menu-toggle').click();
  await expect(selector).toBeVisible();
}

test('cambia la apariencia en vivo, conserva el recorrido y recuerda ambos modos', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.emailjs.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain', body: 'OK' }),
  );
  await page.goto('/');
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  const root = page.locator('html');
  const selector = page.locator('.theme-switch');
  const original = selector.getByRole('button', { name: 'Original', exact: true });
  const glass = selector.getByRole('button', { name: 'Liquid Glass', exact: true });
  const hero = page.locator('.hero');
  const header = page.locator('.header-inner');
  const originalHeader = await header.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  const landscape = await page
    .locator('.journey-opening')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  await expect(root).toHaveAttribute('data-theme', 'original');
  await showAppearance(page);
  await expect(original).toHaveAttribute('aria-pressed', 'true');
  if (info.project.name === 'desktop') {
    await original.hover({ timeout: 10000 });
    await original.focus();
    await expect(selector.getByRole('tooltip')).toContainText('Diseño clásico');
    await page.keyboard.press('Escape');
    await expect(selector.getByRole('tooltip')).toHaveCount(0);
  }
  if (info.project.name === 'mobile') await page.locator('.menu-toggle').click();
  await page.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();

  const stage = page.locator('.journey-stage');
  const canvas = stage.locator('canvas');
  await expect(stage).toHaveClass(/is-ready/);
  await canvas.evaluate((element) => element.setAttribute('data-test-original-canvas', 'true'));
  await stage.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'FinanSmart', exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(stage).toHaveAttribute('data-visited-count', '1');
  await expect(stage).toHaveAttribute('data-current-stop', 'finansmart');
  const sceneHost = stage.locator('.canvas-host');
  const robotPose = () =>
    sceneHost.evaluate((element: HTMLElement) => {
      const { robotX, robotY, robotZ } = element.dataset;
      return [robotX, robotY, robotZ];
    });
  const pose = await robotPose();
  expect(pose.every((value) => value !== undefined)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await showAppearance(page);
  await glass.click();
  await expect(root).toHaveAttribute('data-theme', 'liquid-glass');
  await expect(glass).toHaveAttribute('aria-pressed', 'true');
  await expect(stage).toHaveAttribute('data-visited-count', '1');
  await expect(stage).toHaveAttribute('data-current-stop', 'finansmart');
  await expect(canvas).toHaveAttribute('data-test-original-canvas', 'true');
  expect(await robotPose()).toEqual(pose);
  expect(await canvas.evaluate((element) => getComputedStyle(element).filter)).toBe('none');
  expect(
    await page
      .locator('.journey-opening')
      .evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toBe(landscape);
  expect(
    await header.evaluate((element) => getComputedStyle(element, '::before').backgroundImage),
  ).toContain('radial-gradient');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await glass.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
    '0s',
  );
  if (info.project.name === 'mobile') await page.locator('.menu-toggle').click();
  await expect(hero.getByRole('link', { name: 'Descargar CV', exact: true })).toBeVisible();

  await stage.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.project-code-link:visible')).toHaveAttribute(
    'href',
    /github\.com\/Leo538\/FinanSmart$/,
  );
  expect(await sheet.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain(
    'radial-gradient',
  );
  await expect(sheet.getByRole('tab', { name: 'Actividad', exact: true })).toBeInViewport({
    ratio: 1,
  });
  await sheet.getByRole('tab', { name: 'Actividad', exact: true }).click();
  await expect(sheet.locator('#sheet-activity-panel')).toBeVisible();
  await sheet.getByRole('button', { name: 'Cerrar ficha' }).click();

  const more = page.locator('#mas-proyectos');
  const grid = more.locator('.additional-list');
  const cards = more.locator('.additional-project');
  await expect(cards.locator('h3')).toHaveText([
    'Sistema de Riego',
    'AgroPay',
    'Laboratorio RGB',
    'Novacore',
    'Vinculación de Riego',
    'Pantufladas',
  ]);
  const layout = await grid.evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
    rows: getComputedStyle(element).gridTemplateRows.split(' ').length,
    fits: element.scrollWidth <= element.clientWidth + 1,
  }));
  const mobile = info.project.name === 'mobile';
  expect(layout).toEqual({ columns: mobile ? 2 : 3, rows: mobile ? 3 : 2, fits: true });
  await expect(cards.locator('details[open]')).toHaveCount(0);

  const cardHeights = () =>
    cards.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    );
  const experienceTop = () =>
    page
      .locator('#experiencia')
      .evaluate((element) => element.getBoundingClientRect().top + scrollY);
  const closedHeights = await cardHeights();
  const initialExperienceTop = await experienceTop();
  for (let index = 0; index < closedHeights.length; index++) {
    const card = cards.nth(index);
    await card.locator('summary').click();
    await expect(cards.locator('details[open]')).toHaveCount(1);
    await expect(card.locator('details')).toHaveAttribute('open', '');
    await expect(card.locator('.additional-description > p')).toBeVisible();
    await expect(card.locator('.glass-project-stack')).toBeHidden();
    await expect
      .poll(cardHeights)
      .toEqual(
        closedHeights.map((height, position) => (position === index ? expect.any(Number) : height)),
      );
    expect((await cardHeights())[index]).toBeGreaterThan(closedHeights[index]);
    expect(await experienceTop()).toBeGreaterThan(initialExperienceTop);
  }
  await cards.last().locator('summary').click();
  await expect(cards.locator('details[open]')).toHaveCount(0);
  await expect.poll(cardHeights).toEqual(closedHeights);
  await expect.poll(experienceTop).toBe(initialExperienceTop);

  const pantufladas = more.getByRole('link', { name: 'Ver ficha de Pantufladas', exact: true });
  await pantufladas.scrollIntoViewIfNeeded();
  await expect(pantufladas).toBeInViewport({ ratio: 1 });
  await pantufladas.click();
  await expect(sheet.getByRole('heading', { name: 'Pantufladas', exact: true })).toBeVisible();
  await expect(sheet.locator('.gallery-stage img')).toHaveAttribute(
    'src',
    /pantufladas-login\.jpg$/,
  );
  await sheet.getByRole('button', { name: 'Cerrar ficha' }).click();

  if (info.project.name === 'mobile') {
    const awards = page.locator('#credenciales');
    await awards.getByRole('button', { name: 'Más credenciales', exact: true }).click();
    await expect
      .poll(() => awards.locator('.credential-list').evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }

  const form = page.getByRole('form', { name: 'Formulario de contacto' });
  await form.getByRole('textbox', { name: 'Tu nombre' }).fill('Prueba local');
  await form.getByRole('textbox', { name: 'Tu correo' }).fill('qa@example.com');
  await form.getByRole('textbox', { name: 'Tu mensaje' }).fill('Comprobación de Liquid Glass.');
  await form.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(form.getByRole('status')).toContainText('Tu mensaje se envió correctamente');

  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'liquid-glass');
  await page.evaluate(() => scrollTo(0, 0));
  await showAppearance(page);
  await expect(glass).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(selector).toHaveAttribute('aria-label', 'Appearance');
  await expect(glass).toHaveAccessibleDescription(/Glass surfaces/);
  await original.click();
  await expect(root).toHaveAttribute('data-theme', 'original');
  expect(await header.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
    originalHeader,
  );
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'original');
  await expect(root).toHaveAttribute('lang', 'en');
});
