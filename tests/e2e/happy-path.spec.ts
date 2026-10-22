import { statSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const { E2E_CUSTOMER_EMAIL: cEmail, E2E_CUSTOMER_PASSWORD: cPass, E2E_EXPIRED_EMAIL: xEmail, E2E_EXPIRED_PASSWORD: xPass } = process.env;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('customer: ask, fill, edit, download docx and pdf', async ({ page }) => {
  test.skip(!cEmail || !cPass, 'E2E_CUSTOMER_* not set');
  await login(page, cEmail!, cPass!);
  await page.getByLabel('Describe what is happening…').fill('Staff keeps coming late.');
  await page.getByRole('button', { name: 'Find documents' }).click();
  await page.getByRole('link', { name: 'Use this template' }).first().click();

  const inputs = page.locator('input[id^="f-"]');
  for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill(`Value ${i + 1}`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.locator('.ProseMirror').click();
  await page.keyboard.type('Extra text typed in the editor.');

  for (const [btn, ext] of [['Download Word', '.docx'], ['Download PDF', '.pdf']] as const) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: btn }).click()]);
    expect(dl.suggestedFilename().endsWith(ext)).toBe(true);
    expect(statSync(await dl.path()).size).toBeGreaterThan(0);
  }
});

test('expired customer sees expired notice', async ({ page }) => {
  test.skip(!xEmail || !xPass, 'E2E_EXPIRED_* not set');
  await login(page, xEmail!, xPass!);
  await expect(page.getByText('Your subscription has expired. Please contact us to renew.')).toBeVisible();
});
