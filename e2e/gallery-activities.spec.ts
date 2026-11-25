import { test, expect, type Locator, type Page } from '@playwright/test';

const projectIds = [
  'finansmart',
  'sicop',
  'chatquality',
  'riego',
  'agropay',
  'rgb',
  'novacore',
  'vinculacion',
  'pantufladas',
];

async function openProject(page: Page, id: string): Promise<Locator> {
  await page.goto(`/?proyecto=${id}#mapa`);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

async function compactPanel(dialog: Locator): Promise<void> {
  const bounds = await dialog.locator('[role=tabpanel]:visible').evaluate((panel) => ({
    height: panel.clientHeight,
    contentHeight: panel.scrollHeight,
    width: panel.clientWidth,
    contentWidth: panel.scrollWidth,
  }));
  expect(bounds.contentWidth).toBeLessThanOrEqual(bounds.width + 2);
  expect(bounds.contentHeight).toBeLessThanOrEqual(bounds.height + 2);
}

test('los nueve carruseles muestran vistas reales, navegación y ampliación', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*journey-scene*', (route) => route.abort());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const id of projectIds) {
    const dialog = await openProject(page, id);
    await expect(dialog.getByRole('tab', { name: 'Proyecto', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const teaser = dialog.locator('.project-problem');
    await expect(teaser).toBeInViewport({ ratio: 1 });
    expect((await teaser.innerText()).length).toBeLessThanOrEqual(120);
    await expect(dialog.locator('.project-code-link').filter({ visible: true })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/Leo538\//,
    );
    const gallery = dialog.locator('app-project-gallery');
    const image = gallery.locator('.gallery-stage img');
    const count = await gallery.locator('.gallery-pagination button').count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(
      dialog.locator('.project-code-link:visible svg:has(use[href="#github-icon"])'),
    ).toBeVisible();
    if (id === 'pantufladas') {
      await expect(image).toHaveAttribute('src', /pantufladas-login\.jpg$/);
      await expect(gallery.locator('.gallery-count')).toHaveText('1 / 4');
    }
    const urls: string[] = [];
    for (let index = 0; index < count; index++) {
      await expect(gallery.locator('.gallery-count')).toHaveText(`${index + 1} / ${count}`);
      await image.evaluate((element: HTMLImageElement) => element.decode());
      const dimensions = await image.evaluate((element: HTMLImageElement) => ({
        width: element.naturalWidth,
        height: element.naturalHeight,
      }));
      expect(dimensions.width).toBeGreaterThanOrEqual(400);
      expect(dimensions.height).toBeGreaterThanOrEqual(400);
      urls.push((await image.getAttribute('src'))!);
      await expect(image).toBeInViewport({ ratio: 1 });
      await compactPanel(dialog);
      await gallery.getByRole('button', { name: 'Imagen siguiente', exact: true }).click();
    }
    expect(new Set(urls).size).toBe(count);
    await expect(image).toHaveAttribute('src', urls[0]);
    await gallery.getByRole('button', { name: 'Imagen anterior', exact: true }).click();
    await expect(image).toHaveAttribute('src', urls.at(-1)!);
    const stage = gallery.locator('.gallery-stage');
    await stage.focus();
    await page.keyboard.press('Home');
    await expect(image).toHaveAttribute('src', urls[0]);
    await page.keyboard.press('ArrowRight');
    await expect(image).toHaveAttribute('src', urls[1]);
    await page.keyboard.press('End');
    await expect(image).toHaveAttribute('src', urls.at(-1)!);
    await gallery.locator('.gallery-pagination button').nth(1).click();
    await expect(image).toHaveAttribute('src', urls[1]);
    const popupPromise = page.waitForEvent('popup');
    await gallery.getByRole('link', { name: 'Ver imagen completa', exact: true }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toContain(urls[1]);
    await popup.close();
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await page.screenshot({ path: `artifacts/carrusel-${id}-${info.project.name}.png` });
    if (info.project.name === 'mobile') {
      await stage.focus();
      await page.keyboard.press('Home');
      const box = (await stage.boundingBox())!;
      const session = await page.context().newCDPSession(page);
      const start = { x: box.x + box.width * 0.75, y: box.y + box.height / 2 };
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x - 90, y: start.y }],
      });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(image).toHaveAttribute('src', urls[1]);
      await session.detach();
    }
    await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
    const information = dialog.locator('#sheet-information-panel');
    await expect(information).toBeVisible();
    for (const [buttonName, content] of [
      ['Resumen', '.project-full-description'],
      ['Mi aporte', '.project-module'],
      ['Tecnologías', '.project-stack'],
    ]) {
      const button = information
        .locator('.information-switch')
        .getByRole('button', { name: buttonName, exact: true });
      if (await button.isVisible()) {
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
      }
      await expect(information.locator(content)).toBeVisible();
      await compactPanel(dialog);
    }
    await dialog.getByRole('tab', { name: 'Proyecto', exact: true }).click();
    await expect(gallery).toBeVisible();
    await compactPanel(dialog);
  }
  expect(errors).toEqual([]);
});

test('las cuatro actividades cambian resultados y se pueden reiniciar', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*journey-scene*', (route) => route.abort());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const id of ['riego', 'agropay', 'rgb', 'novacore']) {
    const dialog = await openProject(page, id);
    await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
    const reset = dialog.getByRole('button', { name: 'Reiniciar ejemplo', exact: true });
    const captureResult = () =>
      page.screenshot({ path: `artifacts/actividad-${id}-en-uso-${info.project.name}.png` });
    await compactPanel(dialog);
    if (id === 'riego') {
      const soil = dialog.locator('#demo-soil');
      const temperature = dialog.locator('#demo-temperature');
      await soil.focus();
      await page.keyboard.press('Home');
      await temperature.focus();
      await page.keyboard.press('End');
      await expect(soil).toHaveValue('0');
      await expect(temperature).toHaveValue('50');
      await expect(dialog.getByTestId('irrigation-result')).toContainText(/26[,.]3/);
      const dry = Number(
        (await dialog.getByTestId('irrigation-result').innerText())
          .replace(',', '.')
          .replace(/[^\d.]/g, ''),
      );
      await soil.focus();
      await page.keyboard.press('End');
      await temperature.focus();
      await page.keyboard.press('Home');
      await expect(soil).toHaveValue('64');
      await expect(temperature).toHaveValue('0');
      await expect(dialog.getByTestId('irrigation-result')).toContainText(/3[,.]7/);
      const wet = Number(
        (await dialog.getByTestId('irrigation-result').innerText())
          .replace(',', '.')
          .replace(/[^\d.]/g, ''),
      );
      expect(dry).toBeGreaterThan(wet + 10);
      await captureResult();
      await reset.click();
      await expect(soil).toHaveValue('36');
      await expect(temperature).toHaveValue('25');
      await expect(dialog.getByTestId('irrigation-result')).toContainText('15');
    } else if (id === 'agropay') {
      await dialog.getByRole('button', { name: 'Añadir un kilo', exact: true }).click();
      await expect(dialog.getByTestId('order-total')).toContainText(/4[,.]50/);
      await dialog.getByRole('button', { name: 'Confirmar pedido', exact: true }).click();
      await expect(dialog.getByTestId('order-status')).toHaveText('Pedido recibido');
      await expect(
        dialog.getByRole('button', { name: 'Añadir un kilo', exact: true }),
      ).toBeDisabled();
      await dialog.getByRole('button', { name: 'Revisar pago', exact: true }).click();
      await dialog.getByRole('button', { name: 'Preparar entrega', exact: true }).click();
      await expect(dialog.getByTestId('order-status')).toHaveText('Listo para entregar');
      await captureResult();
      await reset.click();
      await expect(dialog.getByTestId('order-status')).toHaveText('Carrito');
      await expect(dialog.getByTestId('order-total')).toContainText(/3[,.]00/);
    } else if (id === 'rgb') {
      const canvas = dialog.locator('canvas.rgb-adjusted');
      const redSum = () =>
        canvas.evaluate((element: HTMLCanvasElement) => {
          const data = element
            .getContext('2d')!
            .getImageData(0, 0, element.width, element.height).data;
          let red = 0;
          for (let index = 0; index < data.length; index += 4) red += data[index];
          return red;
        });
      await expect.poll(redSum).toBeGreaterThan(0);
      const original = await redSum();
      await dialog.locator('#demo-red').focus();
      await page.keyboard.press('Home');
      expect(await redSum()).toBe(0);
      await captureResult();
      await reset.click();
      expect(await redSum()).toBe(original);
      await expect(dialog.locator('#demo-red, #demo-green, #demo-blue')).toHaveCount(3);
      for (const slider of await dialog.locator('.rgb-controls input').all())
        await expect(slider).toHaveValue('100');
    } else {
      await dialog.getByRole('button', { name: 'IA y datos', exact: true }).click();
      await expect(dialog.getByTestId('studio-service')).toHaveText('IA y datos');
      for (let step = 0; step < 3; step++)
        await dialog.getByRole('button', { name: 'Avanzar etapa', exact: true }).click();
      await expect(dialog.locator('.studio-track [aria-current=step]')).toContainText('Entrega');
      await captureResult();
      await reset.click();
      await expect(dialog.getByTestId('studio-service')).toHaveText('Desarrollo web');
      await expect(dialog.locator('.studio-track [aria-current=step]')).toContainText(
        'Descubrimiento',
      );
    }
    await compactPanel(dialog);
    await page.screenshot({ path: `artifacts/simulacion-${id}-${info.project.name}.png` });
    await dialog.getByRole('tab', { name: 'Proyecto', exact: true }).click();
    await expect(dialog.locator('app-project-gallery')).toBeVisible();
    await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
    await expect(reset).toBeVisible();
    await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  }
  const header = page.locator('.site-header');
  const menu = header.locator('.menu-toggle');
  if (await menu.isVisible()) await menu.click();
  await header.getByRole('button', { name: 'English', exact: true }).click();
  for (const id of ['riego', 'agropay', 'rgb', 'novacore']) {
    const dialog = await openProject(page, id);
    await expect(dialog.getByRole('button', { name: 'Next image', exact: true })).toBeVisible();
    await dialog.getByRole('tab', { name: 'Activity', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Reset example', exact: true })).toBeVisible();
    await expect(dialog.locator('app-additional-project-activity h3')).toHaveText(
      /^\s*(Explore|From|Mix|Build)\b/,
    );
  }
  expect(errors).toEqual([]);
});
