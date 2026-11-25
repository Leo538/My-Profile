import { test, expect, type Locator } from '@playwright/test';

async function expectActivityFits(dialog: Locator): Promise<void> {
  const geometry = await dialog.locator('#sheet-activity-panel').evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    const clipped = Array.from(panel.querySelectorAll('p,h3,a,li,button,input,output,strong'))
      .filter((element) => element.getClientRects().length > 0)
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2 || rect.left < bounds.left - 2 || rect.right > bounds.right + 2
          ? [`${element.tagName}: ${element.textContent?.trim().slice(0, 90)}`] : [];
      });
    return { height: panel.clientHeight, scrollHeight: panel.scrollHeight, width: panel.clientWidth, scrollWidth: panel.scrollWidth, clipped };
  });
  expect(geometry.scrollHeight, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.height + 2);
  expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.width + 2);
  expect(geometry.clipped, JSON.stringify(geometry)).toEqual([]);
}

async function slider(control: Locator, value: number): Promise<void> {
  await control.evaluate((element: HTMLInputElement, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*journey-scene*', (route) => route.abort());
});

test('Vinculación cambia su recomendación con lluvia y humedad, y reinicia', async ({ page }, info) => {
  await page.goto('/?proyecto=vinculacion#mapa');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
  const soil = dialog.getByTestId('iot-soil');
  const rain = dialog.getByTestId('iot-rain');
  const result = dialog.getByTestId('iot-recommendation');
  await expect(result).toHaveText('Regar ahora');
  await expect(dialog.getByTestId('iot-duration')).toHaveText('15–20 minutos');
  await slider(rain, 40);
  await expect(result).toHaveText('Esperar lluvia');
  await expect(dialog.getByTestId('iot-duration')).toHaveText('Revisar en 2 horas');
  await slider(soil, 30);
  await expect(result).toHaveText('No regar');
  await expect(dialog.getByTestId('iot-duration')).toHaveText('Revisar más tarde');
  await slider(soil, 61);
  await expect(dialog.getByTestId('iot-duration')).toHaveText('Revisar en 2 horas');
  await expectActivityFits(dialog);
  await dialog.getByTestId('activity-reset').click();
  await expect(soil).toHaveValue('22');
  await expect(rain).toHaveValue('20');
  await expect(result).toHaveText('Regar ahora');
  await expectActivityFits(dialog);
  await page.screenshot({ path: `artifacts/2026-11-23-vinculacion-activity-${info.project.name}.png` });
});

test('Pantufladas conserva el inventario y completa cuatro acciones, estrella y reinicio', async ({ page }, info) => {
  await page.goto('/?proyecto=pantufladas#mapa');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
  const next = dialog.getByTestId('pantufladas-next');
  const state = dialog.getByTestId('pantufladas-stage');
  await expect(state).toHaveAttribute('data-stage', 'awaiting');
  const expected = [['warehouse', 12, 0, 0, 0], ['transit', 6, 6, 0, 0], ['local', 6, 0, 6, 0], ['sold', 6, 0, 5, 1]] as const;
  for (const [stage, warehouse, transit, local, sold] of expected) {
    await next.click();
    await expect(state).toHaveAttribute('data-stage', stage);
    for (const [id, value] of [['warehouse', warehouse], ['transit', transit], ['local', local]] as const)
      await expect(dialog.getByTestId(`pantufladas-${id}`)).toContainText(String(value));
    await expect(dialog.getByTestId('pantufladas-sold')).toHaveText(`Vendidos: ${sold}`);
    expect(warehouse + transit + local + sold).toBe(12);
    await expectActivityFits(dialog);
  }
  await expect(next).toBeDisabled();
  await expect(dialog.getByTestId('pantufladas-cash')).toContainText('18');
  await expect(dialog.getByTestId('pantufladas-star')).toBeVisible();
  await page.screenshot({ path: `artifacts/2026-11-23-pantufladas-activity-${info.project.name}.png` });
  await dialog.getByTestId('activity-reset').click();
  await expect(state).toHaveAttribute('data-stage', 'awaiting');
  await expect(next).toBeEnabled();
  for (const id of ['warehouse', 'transit', 'local']) await expect(dialog.getByTestId(`pantufladas-${id}`)).toContainText('0');
  await expect(dialog.getByTestId('pantufladas-sold')).toHaveText('Vendidos: 0');
  await expect(dialog.getByTestId('pantufladas-star')).toHaveCount(0);
  await expectActivityFits(dialog);
});

test('Las dos actividades nuevas traducen las decisiones y acciones al inglés', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('portfolio-language', 'en'));
  await page.goto('/?proyecto=vinculacion#mapa');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(dialog.getByTestId('iot-recommendation')).toHaveText('Irrigate now');
  await slider(dialog.getByTestId('iot-rain'), 40);
  await expect(dialog.getByTestId('iot-recommendation')).toHaveText('Wait for rain');
  await expect(dialog.getByTestId('activity-reset')).toHaveText('Reset');
  await page.goto('/?proyecto=pantufladas#mapa');
  await dialog.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(dialog.getByTestId('pantufladas-next')).toContainText('Receive 12 pairs');
  for (let step = 0; step < 4; step++) await dialog.getByTestId('pantufladas-next').click();
  await expect(dialog.getByTestId('pantufladas-stage')).toContainText('Business is running!');
  await expect(dialog.getByTestId('pantufladas-sold')).toHaveText('Sold: 1');
});
