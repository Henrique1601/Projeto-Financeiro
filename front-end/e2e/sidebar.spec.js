import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const email = `e2e_sb_${Date.now()}@test.com`;
    await page.fill('#email', email);
    await page.fill('#password', 'Teste123!');
    await page.click('button[type="submit"]');
    const visible = await page.locator('#pageTitle').isVisible().catch(() => false);
    if (!visible) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="#/register"]');
      await page.waitForSelector('#registerForm', { timeout: 5000 });
      await page.fill('#name', 'Sidebar');
      await page.fill('#surname', 'Test');
      await page.fill('#email', email);
      await page.fill('#password', 'Teste123!');
      await page.click('button[type="submit"]');
    }
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('NAV - sidebar has navigation items', async ({ page }) => {
    const items = page.locator('.nav-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('NAV - clicking Extrato navigates to /extrato', async ({ page }) => {
    const extratoLink = page.locator('.nav-item[data-page="extrato"], .nav-item:has-text("Extrato")').first();
    if (await extratoLink.isVisible()) {
      await extratoLink.click();
      await page.waitForURL(/\/extrato/, { timeout: 5000 });
      await expect(page.locator('#pageTitle')).toHaveText(/Extrato|extrato/);
    }
  });

  test('NAV - clicking Perfil navigates to /perfil', async ({ page }) => {
    const perfilLink = page.locator('.nav-item[data-page="profile"], .nav-item:has-text("Perfil")').first();
    if (await perfilLink.isVisible()) {
      await perfilLink.click();
      await page.waitForURL(/\/perfil/, { timeout: 5000 });
      await expect(page.locator('#pageTitle')).toHaveText(/Perfil|perfil/);
    }
  });

  test('NAV - sidebar toggle button exists', async ({ page }) => {
    const toggle = page.locator('#sidebarToggle, .sidebar-toggle, button:has-text("Toggle")').first();
    await expect(toggle).toBeVisible({ timeout: 3000 });
  });
});
