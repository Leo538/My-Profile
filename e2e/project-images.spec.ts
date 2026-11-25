import { test, expect } from '@playwright/test';

const projects = [
  { id: 'riego', name: 'Sistema de Riego', file: 'riego.png' },
  { id: 'agropay', name: 'AgroPay', file: 'agropay.png' },
  { id: 'rgb', name: 'Laboratorio RGB', file: 'rgb.png' },
  { id: 'novacore', name: 'Novacore', file: 'novacore.jpg' },
] as const;

test('las cuatro fichas muestran capturas reales y permiten abrirlas completas', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Screenshots and project details must remain available independently of WebGL.
  await page.route('**/*journey-scene*', (route) => route.abort());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const project of projects) {
    await page.goto(`/?proyecto=${project.id}#mapa`);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: project.name, exact: true })).toBeVisible();
    const image = dialog.locator('.sheet-preview img');
    await expect(image).toHaveAttribute('src', `/assets/projects/${project.file}`);
    await image.evaluate((element: HTMLImageElement) => element.decode());
    const dimensions = await image.evaluate((element: HTMLImageElement) => ({
      width: element.naturalWidth,
      height: element.naturalHeight,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(400);
    expect(dimensions.height).toBeGreaterThanOrEqual(400);
    await expect(image).toBeInViewport({ ratio: 1 });
    await expect(dialog.locator('.project-emblem')).toHaveCount(0);
    expect(await image.evaluate((element) => getComputedStyle(element).objectFit)).toBe('contain');
    const fullImage = dialog.getByRole('link', { name: 'Ver imagen completa', exact: true });
    await expect(fullImage).toBeInViewport({ ratio: 1 });
    const popupPromise = page.waitForEvent('popup');
    await fullImage.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toContain(`/assets/projects/${project.file}`);
    await expect
      .poll(() =>
        popup.locator('img').evaluate((element: HTMLImageElement) => ({
          width: element.naturalWidth,
          height: element.naturalHeight,
        })),
      )
      .toEqual(dimensions);
    await popup.close();
    const fit = await dialog.locator('#sheet-project-panel').evaluate((element) => ({
      width: element.clientWidth,
      contentWidth: element.scrollWidth,
      height: element.clientHeight,
      contentHeight: element.scrollHeight,
    }));
    expect(fit.contentWidth).toBeLessThanOrEqual(fit.width + 2);
    await expect(dialog.getByRole('button', { name: 'Cerrar ficha', exact: true })).toBeInViewport({
      ratio: 1,
    });
    await page.screenshot({
      path: `artifacts/captura-${project.id}-${testInfo.project.name}.png`,
    });
    await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  const header = page.locator('.site-header');
  const menu = header.locator('.menu-toggle');
  if (await menu.isVisible()) await menu.click();
  await header.getByRole('button', { name: 'English', exact: true }).click();
  for (const project of projects) {
    await page.goto(`/?proyecto=${project.id}#mapa`);
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.sheet-preview img')).toHaveAttribute(
      'alt',
      /^(Actual|Original) /,
    );
    await expect(dialog.getByRole('link', { name: 'View full image', exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
