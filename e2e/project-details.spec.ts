import { test, expect, type Locator } from '@playwright/test';

const projects = [
  ['finansmart', 'FinanSmart'], ['sicop', 'Proyecto-SICOP'],
  ['chatquality', 'ChatQuality'], ['riego', 'Sistema_Riego-IA'],
  ['agropay', 'AgroPay'], ['rgb', 'Laboratorio-rgb'], ['novacore', 'Novacore'],
  ['vinculacion', 'Vinculacion-Sistema-Riego'], ['pantufladas', 'Pantufladas'],
] as const;

/** Check actual geometry, including content clipped by overflow:hidden. */
async function expectCompletePanel(dialog: Locator): Promise<void> {
  const geometry = await dialog.locator('[role="tabpanel"]:visible').evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    const clipped = Array.from(panel.querySelectorAll('p,h3,h4,a,li,button,input,output,select,img'))
      .filter((element) => element.getClientRects().length > 0)
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return [];
        return rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2 || rect.left < bounds.left - 2 || rect.right > bounds.right + 2
          ? [`${element.tagName}: ${element.textContent?.trim().slice(0, 90) || element.getAttribute('alt')}`] : [];
      });
    return { width: panel.clientWidth, height: panel.clientHeight, scrollWidth: panel.scrollWidth, scrollHeight: panel.scrollHeight, clipped };
  });
  expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.width + 2);
  expect(geometry.scrollHeight, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.height + 2);
  expect(geometry.clipped, JSON.stringify(geometry)).toEqual([]);
  await expect(dialog.getByRole('button', { name: 'Cerrar ficha', exact: true })).toBeInViewport({ ratio: 1 });
  await expect(dialog.locator('.sheet-bottom')).toBeInViewport({ ratio: 1 });
}

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Information remains available even if the optional 3D chunk cannot load.
  await page.route('**/*journey-scene*', (route) => route.abort());
});

for (const [id, repository] of projects) {
  test(`${id}: galería y tres vistas completas sin desplazamiento interno`, async ({ page }, info) => {
    await page.goto(`/?proyecto=${id}#mapa`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Proyecto', exact: true })).toHaveAttribute('aria-selected', 'true');
    const projectPanel = dialog.locator('#sheet-project-panel');
    const image = projectPanel.locator('.gallery-stage img');
    await image.evaluate((element: HTMLImageElement) => element.decode());
    expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(500);
    expect((await image.boundingBox())!.height).toBeGreaterThan(info.project.name === 'desktop' ? 240 : 130);
    const summary = await projectPanel.locator('.project-problem').innerText();
    expect(summary.length).toBeGreaterThan(30);
    expect(summary.length).toBeLessThanOrEqual(121);
    const code = projectPanel.getByRole('link', { name: /^Ver código/ });
    await expect(code).toHaveAttribute('href', `https://github.com/Leo538/${repository}`);
    await expect(code).toBeInViewport({ ratio: 1 });
    const next = projectPanel.getByRole('button', { name: 'Imagen siguiente', exact: true });
    await expect(next).toHaveText('');
    await expect(next.locator('svg')).toBeVisible();
    const nextSize = await next.boundingBox();
    expect(nextSize!.width).toBeLessThanOrEqual(48);
    expect(nextSize!.height).toBeLessThanOrEqual(48);
    const count = projectPanel.locator('.gallery-count');
    const total = Number((await count.innerText()).split('/')[1]);
    expect(total).toBeGreaterThanOrEqual(2);
    if (id === 'vinculacion') expect(total).toBe(3);
    if (id === 'pantufladas') expect(total).toBe(4);
    const firstSource = await image.getAttribute('src');
    await next.click();
    await expect(count).toHaveText(`2 / ${total}`);
    await expect(image).not.toHaveAttribute('src', firstSource!);
    await image.evaluate((element: HTMLImageElement) => element.decode());
    await projectPanel.getByRole('button', { name: 'Imagen anterior', exact: true }).click();
    await expect(count).toHaveText(`1 / ${total}`);
    await expect(image).toHaveAttribute('src', firstSource!);
    await expectCompletePanel(dialog);
    await page.screenshot({ path: `artifacts/2026-11-23-project-${id}-${info.project.name}.png` });

    await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
    const information = dialog.locator('#sheet-information-panel');
    const switcher = information.locator('.information-switch');
    const paged = (await page.viewportSize())!.width <= 1000;
    if (paged) {
      await expect(switcher).toBeVisible();
      await switcher.getByRole('button', { name: 'Resumen', exact: true }).click();
    } else {
      await expect(switcher).toBeHidden();
      const columns = await information.locator('.information-card').evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().x));
      expect(columns[1]).toBeGreaterThan(columns[0] + 50);
      expect(columns[2]).toBeGreaterThan(columns[1] + 50);
    }
    await expect(information.getByRole('heading', { name: 'Descripción general', exact: true })).toBeVisible();
    expect((await information.locator('.project-full-description').innerText()).length).toBeGreaterThan(summary.length);
    await expect(information.getByRole('link', { name: /^Ver código/ })).toHaveAttribute('href', `https://github.com/Leo538/${repository}`);
    await expectCompletePanel(dialog);
    if (paged) await switcher.getByRole('button', { name: 'Mi aporte', exact: true }).click();
    await expect(information.getByRole('heading', { name: 'Mi aporte', exact: true })).toBeVisible();
    await expect(information.getByRole('heading', { name: 'Módulos del proyecto', exact: true })).toBeVisible();
    expect(await information.locator('.project-modules li').count()).toBeGreaterThanOrEqual(3);
    const contribution = information.getByRole('link', { name: /Ver aporte en el código/ });
    if (await contribution.count()) await expect(contribution).toHaveAttribute('href', new RegExp(`^https://github.com/Leo538/${repository}/commit/[a-f0-9]{40}$`));
    await expectCompletePanel(dialog);
    if (paged) await switcher.getByRole('button', { name: 'Tecnologías', exact: true }).click();
    await expect(information.getByRole('heading', { name: 'Tecnologías', exact: true })).toBeVisible();
    expect(await information.locator('.project-stack li').count()).toBeGreaterThanOrEqual(4);
    if (id === 'sicop') await expect(information.locator('.project-stack')).not.toContainText('SQL Server');
    await expectCompletePanel(dialog);
    if (['vinculacion', 'pantufladas'].includes(id)) await page.screenshot({ path: `artifacts/2026-11-23-information-${id}-${info.project.name}.png` });
    await dialog.getByRole('tab', { name: 'Actividad', exact: true }).click();
    await expect(dialog.locator('#sheet-activity-panel')).toBeVisible();
    await expectCompletePanel(dialog);
    await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('Información se pagina a 1000 px y traduce las tres vistas al inglés', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto('/?proyecto=vinculacion#mapa');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Información', exact: true }).click();
  const switcher = dialog.locator('.information-switch');
  await expect(switcher).toBeVisible();
  for (const name of ['Resumen', 'Mi aporte', 'Tecnologías']) {
    await switcher.getByRole('button', { name, exact: true }).click();
    await expect(switcher.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expectCompletePanel(dialog);
  }
  await page.evaluate(() => localStorage.setItem('portfolio-language', 'en'));
  await page.reload();
  await expect(dialog.getByRole('tab', { name: 'Project', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.locator('.project-problem')).not.toContainText('Sistema IoT');
  await dialog.getByRole('tab', { name: 'Information', exact: true }).click();
  for (const [button, heading] of [['Overview', 'Overview'], ['My contribution', 'My contribution'], ['Technologies', 'Technologies']]) {
    await switcher.getByRole('button', { name: button, exact: true }).click();
    await expect(dialog.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  // The contribution link belongs to the contribution subpage at this width.
  await switcher.getByRole('button', { name: 'My contribution', exact: true }).click();
  await expect(dialog.getByRole('link', { name: /^View contribution in code/ })).toHaveAttribute('href', /\/commit\/[a-f0-9]{40}$/);
});
