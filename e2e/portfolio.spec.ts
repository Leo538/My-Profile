import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { Locator, Page } from '@playwright/test';

async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    images.forEach((image) => (image.loading = 'eager'));
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  });
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)),
    )
    .toBe(true);
}

async function expectCompleteMap(page: Page, stage: Locator): Promise<void> {
  await expect(stage).toBeInViewport({ ratio: 0.995 });
  const frameBounds = await stage.evaluate((element) => ({
    rect: element.getBoundingClientRect().toJSON(),
    width: innerWidth,
    height: innerHeight,
  }));
  expect(frameBounds.rect.left).toBeGreaterThanOrEqual(-1);
  expect(frameBounds.rect.top).toBeGreaterThanOrEqual(-1);
  expect(frameBounds.rect.right).toBeLessThanOrEqual(frameBounds.width + 1);
  expect(frameBounds.rect.bottom).toBeLessThanOrEqual(frameBounds.height + 1);
  const pins = stage.locator('.station-pin:visible');
  await expect(pins).toHaveCount(3);
  for (const pin of await pins.all()) {
    await expect(pin).toBeInViewport({ ratio: 1 });
    const { bounds, frame } = await pin.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const frame = element.closest('.journey-stage')!.getBoundingClientRect();
      return {
        bounds: { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom },
        frame: { left: frame.left, top: frame.top, right: frame.right, bottom: frame.bottom },
      };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(frame.left - 1);
    expect(bounds.top).toBeGreaterThanOrEqual(frame.top - 1);
    expect(bounds.right).toBeLessThanOrEqual(frame.right + 1);
    expect(bounds.bottom).toBeLessThanOrEqual(frame.bottom + 1);
  }
}

function moneyValue(text: string): number {
  return Number(
    text
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );
}

async function activityTab(dialog: Locator, english = false): Promise<void> {
  const tab = dialog.getByRole('tab', { name: english ? 'Activity' : 'Actividad', exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.locator('#sheet-activity-panel')).toBeVisible();
}

async function informationSection(
  dialog: Locator,
  section: 'overview' | 'contribution' | 'technologies',
  english = false,
): Promise<void> {
  await dialog
    .getByRole('tab', { name: english ? 'Information' : 'Información', exact: true })
    .click();
  const panel = dialog.locator('#sheet-information-panel');
  await expect(panel).toBeVisible();
  const names = {
    overview: english ? 'Overview' : 'Resumen',
    contribution: english ? 'My contribution' : 'Mi aporte',
    technologies: english ? 'Technologies' : 'Tecnologías',
  };
  const button = panel
    .locator('.information-switch')
    .getByRole('button', { name: names[section], exact: true });
  if (await button.isVisible()) {
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await expectCompactPanel(dialog);
}

async function expectCompactPanel(dialog: Locator): Promise<void> {
  const size = await dialog.locator('[role="tabpanel"]:visible').evaluate((panel) => ({
    width: panel.clientWidth,
    scrollWidth: panel.scrollWidth,
    height: panel.clientHeight,
    scrollHeight: panel.scrollHeight,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width + 2);
  expect(size.scrollHeight).toBeLessThanOrEqual(size.height + 2);
}

async function allScheduleRows(dialog: Locator): Promise<string[][]> {
  const tab = dialog.getByRole('tab', { name: 'Cuotas', exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const panel = dialog.locator('#sheet-schedule-panel');
  const previous = panel.getByRole('button', { name: 'Anterior', exact: true });
  while (await previous.isEnabled()) {
    const firstMonth = await panel.locator('tbody tr').first().locator('td').first().innerText();
    await previous.click();
    await expect(panel.locator('tbody tr').first().locator('td').first()).not.toHaveText(
      firstMonth,
    );
  }
  const rows: string[][] = [];
  const next = panel.getByRole('button', { name: 'Siguiente', exact: true });
  for (let page = 0; page < 9; page += 1) {
    const current = await panel
      .locator('tbody tr')
      .evaluateAll((entries) =>
        entries.map((entry) =>
          Array.from(entry.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? ''),
        ),
      );
    expect(current.length).toBeGreaterThan(0);
    expect(current.length).toBeLessThanOrEqual(4);
    rows.push(...current);
    if (await next.isDisabled()) break;
    const firstMonth = current[0][0];
    await next.click();
    await expect(panel.locator('tbody tr').first().locator('td').first()).not.toHaveText(
      firstMonth,
    );
  }
  await expectCompactPanel(dialog);
  return rows;
}

test('portada, identidad, credenciales y formulario', async ({ page }, testInfo) => {
  let messages = 0;
  await page.route('https://api.emailjs.com/**', async (route) => {
    messages += 1;
    const payload = route.request().postDataJSON();
    expect(payload.service_id).toBeTruthy();
    expect(payload.template_id).toBeTruthy();
    expect(payload.user_id).toBeTruthy();
    expect(payload.template_params).toMatchObject({
      name: 'Prueba local',
      email: 'qa@example.com',
      reply_to: 'qa@example.com',
      message: 'Verificación del formulario con envío interceptado.',
    });
    await route.fulfill({
      status: messages === 1 ? 503 : 200,
      contentType: 'text/plain',
      body: messages === 1 ? 'Service unavailable' : 'OK',
    });
  });
  await page.goto('/');
  const name = page.getByRole('heading', { name: 'Leonel Barros', exact: true });
  await expect(name).toBeVisible();
  await expect(name.locator(':scope > span')).toHaveText(['Leonel', 'Barros']);
  const firstLine = await name.locator(':scope > span').nth(0).boundingBox();
  const secondLine = await name.locator(':scope > span').nth(1).boundingBox();
  expect(secondLine!.y).toBeGreaterThanOrEqual(firstLine!.y + firstLine!.height - 2);
  await expect(page.getByText('Estación Ambato', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Recorrer mis proyectos' })).toBeVisible();
  const fontFamilies = await page
    .locator('.hero h1, app-hero-typewriter, .hero-intro, .hero-actions .button')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fontFamily));
  expect(new Set(fontFamilies).size).toBe(1);
  await expect(page.getByRole('img', { name: 'Firma manuscrita Leo' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Retrato de Leonel Barros' })).toHaveCount(0);
  await expect
    .poll(
      () =>
        page.locator('.signature-tail').evaluate((path) => getComputedStyle(path).strokeDashoffset),
      { timeout: 12000 },
    )
    .toBe('0px');
  await expect
    .poll(
      () =>
        page
          .locator('.signature-bridge path')
          .evaluate((path) => getComputedStyle(path).strokeDashoffset),
      { timeout: 12000 },
    )
    .toBe('0px');
  const signatureDot = page.locator('.signature .signature-dot');
  await expect(signatureDot).toBeVisible();
  await expect.poll(() => signatureDot.evaluate((dot) => getComputedStyle(dot).opacity)).toBe('1');
  expect(
    await page.locator('.signature').evaluate((signature) => {
      const tail = signature.querySelector<SVGPathElement>('.signature-tail')!;
      const dot = signature.querySelector<SVGCircleElement>('.signature-dot')!;
      const end = tail.getPointAtLength(tail.getTotalLength());
      return dot.cx.baseVal.value > end.x && Math.abs(dot.cy.baseVal.value - end.y) < 1;
    }),
  ).toBe(true);
  await waitForImages(page);
  await page.locator('.journey-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('.journey-stage')).toHaveClass(/is-ready/);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/portada-noche-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const additional = page.locator('#mas-proyectos');
  const additionalLinks = [
    ['Sistema de Riego', 'Sistema_Riego-IA'],
    ['AgroPay', 'AgroPay'],
    ['Laboratorio RGB', 'Laboratorio-rgb'],
    ['Novacore', 'Novacore'],
    ['Vinculación de Riego', 'Vinculacion-Sistema-Riego'],
    ['Pantufladas', 'Pantufladas'],
  ];
  for (const [name, repository] of additionalLinks) {
    await expect(additional.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(additional.getByRole('link', { name: `Ver código de ${name}` })).toHaveAttribute(
      'href',
      `https://github.com/Leo538/${repository}`,
    );
  }
  const credentials = page.locator('#credenciales');
  await expect(credentials.getByRole('link', { name: /Ver credencial/ })).toHaveCount(5);
  for (const img of await credentials.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  }
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.getByRole('textbox', { name: 'Tu correo' }).fill('correo-invalido');
  expect(
    await page
      .getByRole('textbox', { name: 'Tu correo' })
      .evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  await page.getByRole('textbox', { name: 'Tu nombre' }).fill('Prueba local');
  await page.getByRole('textbox', { name: 'Tu correo' }).fill('qa@example.com');
  await page
    .getByRole('textbox', { name: 'Tu mensaje' })
    .fill('Verificación del formulario con envío interceptado.');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('status').last()).toContainText('No se pudo enviar');
  await expect(page.getByRole('textbox', { name: 'Tu nombre' })).toHaveValue('Prueba local');
  const draft = page.getByRole('link', { name: 'Abrir en mi correo' });
  await expect(draft).toHaveAttribute('href', /^mailto:lozadaleonel15@gmail\.com\?subject=/);
  expect(decodeURIComponent((await draft.getAttribute('href'))!)).toContain(
    'Verificación del formulario con envío interceptado.',
  );
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('status').last()).toContainText('Tu mensaje se envió correctamente');
  await expect(page.getByRole('textbox', { name: 'Tu nombre' })).toHaveValue('');
  expect(messages).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('recorrer las tres paradas, explorar fichas y conservar posición', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  test.setTimeout(90000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Recorrer mis proyectos' }).click();
  const stage = page.locator('.journey-stage');
  await expect(stage).toBeFocused();
  await expect(stage).toHaveClass(/is-ready/);
  await expectCompleteMap(page, stage);
  await page
    .locator('#mapa')
    .screenshot({ path: `artifacts/mapa-noche-${testInfo.project.name}.png` });
  if (testInfo.project.name === 'desktop') {
    await stage.focus();
    await page.keyboard.down('w');
    try {
      await expect(page.getByRole('button', { name: /Abrir SICOP/ })).toBeVisible({
        timeout: 15000,
      });
    } finally {
      await page.keyboard.up('w');
    }
    await page.keyboard.press('e');
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'SICOP', exact: true }),
    ).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar ficha' }).click();
    await expect(stage).toHaveAttribute('data-current-stop', 'sicop');
    await expect(stage).toBeFocused();
    await page.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).tap();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'FinanSmart', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Ver código', exact: false })).toHaveAttribute(
    'href',
    'https://github.com/Leo538/FinanSmart',
  );
  await expect(dialog.locator('app-project-gallery .gallery-stage img')).toBeVisible();
  await expect(dialog.locator('.project-problem')).toBeInViewport({ ratio: 1 });
  await informationSection(dialog, 'contribution');
  await expect(
    dialog.getByText('Refactoricé la interfaz y el simulador de créditos', { exact: false }),
  ).toBeVisible();
  await informationSection(dialog, 'technologies');
  await expect(dialog.locator('.project-stack')).toContainText('Angular 20');
  await expect(dialog.locator('.project-stack')).toContainText('PostgreSQL');
  await dialog.getByRole('tab', { name: 'Proyecto', exact: true }).click();
  await expectCompactPanel(dialog);
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('body')).toHaveCSS('overflow-y', 'hidden');
  await page.screenshot({ path: `artifacts/ficha-fluida-finansmart-${testInfo.project.name}.png` });
  await activityTab(dialog);
  await expect(dialog.getByLabel('Plazo del ejemplo', { exact: true })).toHaveValue('12');
  await expectCompactPanel(dialog);
  for (const months of [6, 12, 24, 36]) {
    await activityTab(dialog);
    await dialog.getByLabel('Plazo del ejemplo').selectOption(String(months));
    await expect(dialog.locator('.loan-comparison')).toContainText(`${months} meses`);
    await dialog.getByRole('button', { name: 'Francesa', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Francesa', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const frenchTotalInterest = moneyValue(
      await dialog.locator('.loan-summary > div').nth(1).innerText(),
    );
    const french = await allScheduleRows(dialog);
    expect(french.map((row) => Number(row[0]))).toEqual(
      Array.from({ length: months }, (_, index) => index + 1),
    );
    const frenchFirst = moneyValue(french[0][1]);
    expect(moneyValue(french[months - 2][1])).toBe(frenchFirst);
    expect(Math.abs(moneyValue(french[months - 1][1]) - frenchFirst)).toBeLessThanOrEqual(
      months * 0.01,
    );
    expect(moneyValue(french[months - 1][4])).toBe(0);
    await activityTab(dialog);
    await dialog.getByRole('button', { name: 'Alemana', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Alemana', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const germanTotalInterest = moneyValue(
      await dialog.locator('.loan-summary > div').nth(1).innerText(),
    );
    expect(germanTotalInterest).toBeLessThan(frenchTotalInterest);
    const german = await allScheduleRows(dialog);
    expect(german).toHaveLength(months);
    expect(moneyValue(german[0][1])).toBeGreaterThan(moneyValue(german[months - 1][1]));
    expect(moneyValue(german[months - 1][4])).toBe(0);
  }
  await activityTab(dialog);
  await dialog.getByRole('button', { name: 'Reiniciar ejemplo' }).click();
  await expect(dialog.getByLabel('Plazo del ejemplo')).toHaveValue('12');
  await expect(dialog.getByRole('button', { name: 'Francesa', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expectCompactPanel(dialog);
  await page.screenshot({
    path: `artifacts/actividad-fluida-finansmart-${testInfo.project.name}.png`,
  });
  await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(stage).toHaveAttribute('data-current-stop', 'finansmart');
  await expect(stage).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');

  await page.getByRole('button', { name: 'Visitar SICOP', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'SICOP', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Ver código', exact: false })).toHaveAttribute(
    'href',
    'https://github.com/Leo538/Proyecto-SICOP',
  );
  await expectCompactPanel(dialog);
  await page.screenshot({ path: `artifacts/ficha-fluida-sicop-${testInfo.project.name}.png` });
  await activityTab(dialog);
  await expect(dialog.getByRole('status')).toHaveText('Registrada');
  await dialog.getByRole('button', { name: 'Pasar a revisión jurídica' }).click();
  await expect(dialog.getByRole('status')).toHaveText('En revisión jurídica');
  await expect(stage).toHaveAttribute('data-policy-stage', '1');
  await dialog.getByRole('button', { name: 'Validar revisión jurídica' }).click();
  await expect(dialog.getByRole('status')).toHaveText('En validación financiera');
  await expect(stage).toHaveAttribute('data-policy-stage', '2');
  await dialog.getByRole('button', { name: 'Validar revisión financiera' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Validada');
  await expect(stage).toHaveAttribute('data-policy-stage', '3');
  await expectCompactPanel(dialog);
  await dialog.getByRole('button', { name: 'Reiniciar recorrido' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Registrada');
  await expect(stage).toHaveAttribute('data-policy-stage', '0');
  await dialog.getByRole('button', { name: /Volver a esta parada/ }).click();
  await expect(stage).toHaveAttribute('data-current-stop', 'sicop');

  await page.getByRole('button', { name: 'Visitar ChatQuality', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'ChatQuality', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Ver código', exact: false })).toHaveAttribute(
    'href',
    'https://github.com/Leo538/ChatQuality',
  );
  await expect(dialog.locator('app-project-gallery .gallery-stage img')).toHaveAttribute(
    'src',
    '/assets/projects/chatquality.png',
  );
  await expectCompactPanel(dialog);
  await page.screenshot({
    path: `artifacts/ficha-fluida-chatquality-${testInfo.project.name}.png`,
  });
  await expect(dialog.locator('.project-problem')).toContainText(
    /Aplicación de chat y videollamadas/,
  );
  await activityTab(dialog);
  for (let index = 0; index < 6; index += 1) {
    await dialog.getByRole('button', { name: 'Enviar mensaje simulado' }).click();
    await expect(dialog.locator('.transmission-row')).toHaveCount(index + 1);
    await expect(dialog.locator('.transmission-row').nth(index)).toContainText(
      index < 5 ? 'Enviado' : 'Bloqueado',
    );
  }
  await expect(stage).toHaveAttribute('data-chat-accepted', '5');
  await expect(stage).toHaveAttribute('data-chat-blocked', '1');
  await expectCompactPanel(dialog);
  await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(stage).toHaveAttribute('data-current-stop', 'chatquality');
  await expect(stage).toBeFocused();
  await stage.getByRole('button', { name: /Abrir ChatQuality/ }).click();
  await activityTab(dialog);
  await expect(dialog.locator('.transmission-row')).toHaveCount(6);
  await dialog.getByRole('button', { name: 'Reiniciar envíos' }).click();
  await expect(stage).toHaveAttribute('data-chat-accepted', '0');
  await expect(stage).toHaveAttribute('data-chat-blocked', '0');
  await dialog.getByRole('button', { name: 'Reproducir seis envíos' }).click();
  await expect(dialog.locator('.transmission-row')).toHaveCount(6);
  await expect(dialog.locator('.transmission-row').nth(4)).toContainText('Enviado');
  await expect(dialog.locator('.transmission-row').nth(5)).toContainText('Bloqueado');
  await expect(dialog.getByRole('status')).toContainText('El sexto envío fue bloqueado');
  await dialog.getByRole('button', { name: 'Reiniciar envíos' }).click();
  await expect(dialog.locator('.transmission-row')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(stage).toHaveAttribute('data-current-stop', 'chatquality');
  await page.getByRole('button', { name: 'Volver a la plaza', exact: true }).click();
  await expect(stage).not.toHaveAttribute('data-current-stop', /.+/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('enlaces directos y menú disponibles cuando falla el 3D', async ({ page }, testInfo) => {
  await page.route('**/*journey-scene*', (route) => route.abort());
  await page.goto('/?proyecto=sicop#mapa');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'SICOP', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(page.locator('.journey-stage')).toHaveAttribute('data-current-stop', 'sicop');
  await page.locator('.site-header').scrollIntoViewIfNeeded();
  const menu = page.getByRole('button', { name: /Menú/ });
  if (await menu.isVisible()) await menu.click();
  await page.locator('.project-navigation > summary').click();
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('link', { name: 'FinanSmart' })
    .click();
  await expect(dialog.getByRole('heading', { name: 'FinanSmart', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByRole('button', { name: 'Visitar ChatQuality', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'ChatQuality', exact: true })).toBeVisible();
});

test('movimiento reducido deja la firma completa y el acceso a paradas inmediato', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page
      .locator('.signature-stroke')
      .evaluate((path) => getComputedStyle(path).strokeDashoffset),
  ).toBe('0px');
  expect(
    await page.locator('.signature-tail').evaluate((path) => getComputedStyle(path).animationName),
  ).toBe('none');
  await page.getByRole('link', { name: 'Recorrer mis proyectos' }).click();
  await page.getByRole('button', { name: 'Visitar FinanSmart', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('ES/EN traduce la interfaz, conserva el idioma y mantiene las actividades', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const header = page.locator('.site-header');
  const openLanguageMenu = async () => {
    await header.scrollIntoViewIfNeeded();
    const toggle = header.locator('.menu-toggle');
    if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) !== 'true') {
      await toggle.click();
    }
  };
  await openLanguageMenu();
  await header.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(header.getByRole('link', { name: /GitHub|LinkedIn/ })).toHaveCount(0);
  for (const label of ['Journey', 'Experience', 'Credentials', 'Contact']) {
    await expect(header.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await expect(header.locator('.project-navigation > summary')).toContainText('Projects');
  await expect(page.getByRole('heading', { name: 'Leonel Barros', exact: true })).toBeVisible();
  await expect(page.locator('.hero-intro')).toContainText('Software Engineering student');
  await expect(page.getByRole('link', { name: 'Explore my projects', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download CV', exact: true })).toBeVisible();
  for (const heading of [
    'More projects.',
    'Experience and education.',
    'Badges and certificates.',
    'Contact.',
  ]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByLabel('Your name', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Your email', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Your message', { exact: true })).toBeVisible();
  await expect(
    page.locator('#credenciales').getByRole('link', { name: 'Verify credential', exact: false }),
  ).toHaveCount(5);

  const additional = page.locator('#mas-proyectos');
  await additional.locator('.additional-details > summary').nth(0).click();
  await additional.locator('.additional-details > summary').nth(1).click();
  await expect(additional.locator('.additional-description p').nth(0)).toContainText('irrigation');
  await expect(additional.locator('.additional-description p').nth(1)).toContainText('farmers');
  await expect(
    additional.getByRole('heading', { name: 'Sistema de Riego', exact: true }),
  ).toBeVisible();
  await expect(
    additional.getByRole('heading', { name: 'Laboratorio RGB', exact: true }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) > 700) {
    const rowBottoms = await additional
      .locator('.additional-project')
      .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().bottom));
    expect(Math.abs(rowBottoms[0] - rowBottoms[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(rowBottoms[2] - rowBottoms[3])).toBeLessThanOrEqual(1);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: 'Explore my projects', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Explore my projects', exact: true }).click();
  const stage = page.locator('.journey-stage');
  await expect(stage).toHaveClass(/is-ready/);
  await expectCompleteMap(page, stage);
  await expect(stage).toHaveAttribute('aria-label', /Project map/);
  await expect(stage.locator('.map-intro p')).toBeVisible();
  await expect(stage.locator('.map-intro p')).not.toHaveText('Three stops. Your own path.');
  await expect(stage.getByRole('button', { name: 'Back to the plaza', exact: true })).toBeVisible();

  const dialog = page.getByRole('dialog');
  await stage.getByRole('button', { name: 'Visit FinanSmart', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'FinanSmart', exact: true })).toBeVisible();
  await expect(dialog.locator('.project-problem')).toContainText('loans');
  await informationSection(dialog, 'contribution', true);
  await expect(dialog.getByRole('heading', { name: 'My contribution', exact: true })).toBeVisible();
  await informationSection(dialog, 'technologies', true);
  await expect(dialog.getByRole('heading', { name: 'Technologies', exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: 'Project', exact: true }).click();
  await expect(dialog.getByRole('link', { name: 'View code', exact: false })).toHaveAttribute(
    'href',
    'https://github.com/Leo538/FinanSmart',
  );
  await activityTab(dialog, true);
  await expect(dialog.getByLabel('Example term', { exact: true })).toHaveValue('12');
  await dialog.getByLabel('Example term', { exact: true }).selectOption('24');
  await expect(dialog.locator('.loan-comparison')).toContainText('24 months');
  await expect(dialog.getByRole('button', { name: 'German', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(dialog.getByLabel('Example term', { exact: true })).toHaveValue('12');
  await dialog.getByRole('button', { name: 'Return to this stop', exact: false }).click();

  await stage.getByRole('button', { name: 'Visit SICOP', exact: true }).click();
  await activityTab(dialog, true);
  await expect(dialog.getByRole('status')).toHaveText('Registered');
  await dialog.getByRole('button', { name: 'Start legal review', exact: false }).click();
  await expect(dialog.getByRole('status')).toHaveText('Under legal review');
  await expect(stage).toHaveAttribute('data-policy-stage', '1');
  await dialog.getByRole('button', { name: 'Close project', exact: true }).click();
  await stage.getByRole('button', { name: 'Open SICOP', exact: false }).click();
  await activityTab(dialog, true);
  await expect(dialog.getByRole('status')).toHaveText('Under legal review');
  await expect(dialog.getByLabel('Archive lights', { exact: true })).toHaveAttribute(
    'data-stage',
    '1',
  );
  await dialog.getByRole('button', { name: 'Close project', exact: true }).click();

  await stage.getByRole('button', { name: 'Visit ChatQuality', exact: true }).click();
  await expect(dialog.locator('.project-problem')).toContainText('video');
  await activityTab(dialog, true);
  for (let index = 0; index < 6; index += 1) {
    await dialog.getByRole('button', { name: 'Send simulated message', exact: false }).click();
  }
  await expect(dialog.locator('.transmission-row')).toHaveCount(6);
  await expect(dialog.locator('.transmission-row').last()).toContainText('Blocked');
  await expect(dialog.getByRole('status')).toContainText('The sixth message was blocked.');
  await expect(stage).toHaveAttribute('data-chat-accepted', '5');
  await expect(stage).toHaveAttribute('data-chat-blocked', '1');
  await dialog.getByRole('button', { name: 'Close project', exact: true }).click();
  await stage.getByRole('button', { name: 'Open ChatQuality', exact: false }).click();
  await activityTab(dialog, true);
  await expect(dialog.locator('.transmission-row')).toHaveCount(6);
  await dialog.getByRole('button', { name: 'Close project', exact: true }).click();

  await openLanguageMenu();
  await header.getByRole('button', { name: 'Español', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { name: 'Más proyectos.', exact: true })).toBeVisible();
  const menuToggle = header.locator('.menu-toggle');
  if (
    (await menuToggle.isVisible()) &&
    (await menuToggle.getAttribute('aria-expanded')) === 'true'
  ) {
    await menuToggle.click();
  }
  await page.getByRole('link', { name: 'Recorrer mis proyectos', exact: true }).click();
  await expect(stage).toHaveAttribute('data-policy-stage', '1');
  await expect(stage).toHaveAttribute('data-chat-blocked', '1');
  await stage.getByRole('button', { name: 'Visitar SICOP', exact: true }).click();
  await activityTab(dialog);
  await expect(dialog.getByRole('status')).toHaveText('En revisión jurídica');
  await dialog.getByRole('button', { name: 'Reiniciar recorrido', exact: true }).click();
  await expect(stage).toHaveAttribute('data-policy-stage', '0');
  await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click();
  await stage.getByRole('button', { name: 'Visitar ChatQuality', exact: true }).click();
  await activityTab(dialog);
  await dialog.getByRole('button', { name: 'Reiniciar envíos', exact: true }).click();
  await expect(stage).toHaveAttribute('data-chat-accepted', '0');
  await expect(stage).toHaveAttribute('data-chat-blocked', '0');
});

test('WASD responde sin clic, el mapa descansa y el formulario conserva sus teclas', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/');
  const stage = page.locator('.journey-stage');
  const host = stage.locator('.canvas-host');
  await stage.evaluate((element) => {
    (document.activeElement as HTMLElement | null)?.blur();
    element.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await expect(stage).toHaveClass(/is-ready/);
  await expectCompleteMap(page, stage);
  await expect(stage).not.toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  await expect(host).toHaveAttribute('data-scene-state', 'idle');
  const idleFrames = await host.getAttribute('data-render-frames');
  await page.waitForTimeout(2000);
  expect(await host.getAttribute('data-render-frames')).toBe(idleFrames);
  expect(Number(await host.getAttribute('data-render-pixel-ratio'))).toBeLessThanOrEqual(1.5);
  expect(Number(await host.getAttribute('data-scene-geometries'))).toBeGreaterThan(0);

  await page.keyboard.down('w');
  try {
    await expect
      .poll(async () => Number(await host.getAttribute('data-render-frames')))
      .toBeGreaterThan(Number(idleFrames));
    await expect(stage.getByRole('button', { name: /Abrir SICOP/ })).toBeVisible({
      timeout: 15000,
    });
  } finally {
    await page.keyboard.up('w');
  }
  await page.keyboard.press('e');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'SICOP', exact: true })).toBeVisible();
  await expect(host).toHaveAttribute('data-scene-state', 'paused');
  const modalFrames = await host.getAttribute('data-render-frames');
  await page.waitForTimeout(400);
  expect(await host.getAttribute('data-render-frames')).toBe(modalFrames);
  await expectCompactPanel(dialog);
  await expect(page.locator('body')).toHaveCSS('overflow-y', 'hidden');
  await dialog.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(page.locator('body')).not.toHaveCSS('overflow-y', 'hidden');

  await page.locator('#contacto').evaluate((element) => {
    (document.activeElement as HTMLElement | null)?.blur();
    element.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await expect(host).toHaveAttribute('data-scene-state', 'paused');
  const offscreenFrames = await host.getAttribute('data-render-frames');
  const message = page.getByRole('textbox', { name: 'Tu mensaje', exact: true });
  await message.fill('');
  await message.pressSequentially('wasd WASD');
  await expect(message).toHaveValue('wasd WASD');
  await page.waitForTimeout(300);
  expect(await host.getAttribute('data-render-frames')).toBe(offscreenFrames);
  await message.blur();
  const beforeArrow = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(beforeArrow);
  for (const selector of ['html', 'body']) {
    await expect(page.locator(selector)).toHaveCSS('scrollbar-width', 'none');
  }
});

test('descargar y abrir el PDF del CV', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Descargar CV' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    'assets/documents/Leonel-Barros-CV.pdf?v=b26d354d5123',
  );
  await expect(link).toHaveAttribute('download', 'Barros_Leonel_CV.pdf');
  const preview = page.getByRole('link', { name: 'Ver CV en el navegador' });
  await expect(preview).toHaveAttribute('target', '_blank');
  await expect(preview).toHaveAttribute('href', await link.getAttribute('href'));
  const resolved = await link.evaluate((anchor: HTMLAnchorElement) => anchor.href);
  expect(new URL(resolved).protocol).toMatch(/^https?:$/);
  const served = await page.request.get(resolved);
  expect(served.status()).toBe(200);
  expect(served.headers()['content-type']).toMatch(/application\/pdf/i);
  const servedBytes = await served.body();
  const original = await readFile('public/assets/documents/Leonel-Barros-CV.pdf');
  const expectedHash = 'b26d354d51239fca4c29e899479a449dd93b0d416edfcd7f39cc04ab1a039ea9';
  expect(createHash('sha256').update(original).digest('hex')).toBe(expectedHash);
  expect(servedBytes.equals(original)).toBe(true);
  expect((servedBytes.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length).toBe(2);
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  expect(download.suggestedFilename()).toBe('Barros_Leonel_CV.pdf');
  const path = await download.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
});
