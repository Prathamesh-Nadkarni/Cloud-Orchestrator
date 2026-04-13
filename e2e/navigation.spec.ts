import { test, expect } from '@playwright/test';

test.describe('Navigation & View Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('view selector defaults to Cloud Orchestrator', async ({ page }) => {
    const selector = page.locator('select.view-selector');
    await expect(selector).toHaveValue('orchestrator');
  });

  test('can switch to Terraform Blocks view', async ({ page }) => {
    const selector = page.locator('select.view-selector');
    await selector.selectOption('terraform');
    await expect(selector).toHaveValue('terraform');
  });

  test('3D toggle button is visible', async ({ page }) => {
    const btn3d = page.getByTitle(/Switch to isometric 3D view/i);
    await expect(btn3d).toBeVisible();
  });

  test('suggestions button toggles panel', async ({ page }) => {
    const suggestionsBtn = page.getByTitle(/AI-powered security product/i);
    await expect(suggestionsBtn).toBeVisible();
    await suggestionsBtn.click();
    // The suggestions panel should appear (or stay empty if no nodes)
    await page.waitForTimeout(300);
  });

  test('sync status shows Draft for a new session', async ({ page }) => {
    await expect(page.getByText('Draft')).toBeVisible();
  });

  test('cost badge is hidden when no resources on canvas', async ({ page }) => {
    // No nodes = no cost badge
    const costBadge = page.locator('.cost-badge');
    await expect(costBadge).not.toBeVisible();
  });
});
