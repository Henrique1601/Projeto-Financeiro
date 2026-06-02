import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;
const TEST_PASS = 'Teste123!';
const TEST_NOME = 'E2E';
const TEST_SOBRENOME = 'Test';

test.describe('Authentication Flow', () => {
  test('REGISTER - creates account and redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.click('text=Criar Conta');
    await page.waitForSelector('#registerForm', { timeout: 5000 });
    await page.fill('input[name="nome"]', TEST_NOME);
    await page.fill('input[name="sobrenome"]', TEST_SOBRENOME);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="senha"]', TEST_PASS);
    await page.fill('input[name="confirmarSenha"]', TEST_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('#pageTitle')).toHaveText('Dashboard');
  });

  test('LOGIN - authenticates existing user', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="senha"]', TEST_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('#pageTitle')).toHaveText('Dashboard');
  });

  test('LOGIN - shows error for wrong password', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="senha"]', 'WrongPass1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.toast, .error-message, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('LOGOUT - redirects to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="senha"]', TEST_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    const profileLink = page.locator('.nav-item[data-page="profile"], a[href*="perfil"]').first();
    if (await profileLink.isVisible()) await profileLink.click();
    await page.waitForURL(/\/perfil/, { timeout: 5000 });
    const logoutBtn = page.locator('button:has-text("Sair"), button:has-text("Logout"), a:has-text("Sair")').first();
    if (await logoutBtn.isVisible()) await logoutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });
});
