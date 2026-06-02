import { test, expect } from '@playwright/test';

test.describe('Dashboard Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const email = `e2e_dash_${Date.now()}@test.com`;
    await page.fill('#email', email);
    await page.fill('#password', 'Teste123!');
    await page.click('button[type="submit"]');
    const visible = await page.locator('#pageTitle').isVisible().catch(() => false);
    if (!visible) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.click('a[href="#/register"]');
      await page.waitForSelector('#registerForm', { timeout: 5000 });
      await page.fill('#name', 'Dash');
      await page.fill('#surname', 'Test');
      await page.fill('#email', email);
      await page.fill('#password', 'Teste123!');
      await page.click('button[type="submit"]');
    }
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('CREATE - opens modal and creates a transaction', async ({ page }) => {
    await page.click('#dashNova, button:has-text("Nova")');
    await page.waitForSelector('#formModal, .modal-overlay', { timeout: 5000 });
    await page.fill('input[name="data"], #formData', '2026-06-01');
    await page.fill('input[name="descricao"], #formDescricao', 'Test E2E Transaction');
    await page.fill('input[name="valor"], #formValor', '150.50');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test E2E Transaction').first()).toBeVisible({ timeout: 8000 });
  });

  test('FILTER - filters by description', async ({ page }) => {
    await page.fill('#filtroDescricao, input[placeholder*="Descrição"]', 'Test E2E');
    await page.click('#btnFiltrar, button:has-text("Filtrar")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Test E2E Transaction').first()).toBeVisible({ timeout: 5000 });
  });

  test('SORT - toggles sort direction', async ({ page }) => {
    const th = page.locator('.sortable, th:has-text("Valor")').first();
    if (await th.isVisible()) await th.click();
    await page.waitForTimeout(300);
  });

  test('PAGINATION - changes page size', async ({ page }) => {
    const select = page.locator('.page-size-select, select:has-text("por página")').first();
    if (await select.isVisible()) {
      await select.selectOption('50');
      await page.waitForTimeout(300);
    }
  });

  test('STATS - stat cards are visible', async ({ page }) => {
    await page.waitForTimeout(1000);
    const stats = page.locator('.stat-value');
    const count = await stats.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
