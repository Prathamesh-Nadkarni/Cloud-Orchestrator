import { test, expect } from '@playwright/test';

test.describe('Tutorial & Samples', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens tutorial overlay via Tutorial button', async ({ page }) => {
    const tutorialBtn = page.getByTitle(/Open the tutorial guide/i);
    await tutorialBtn.click();

    await expect(page.getByText('Getting Started')).toBeVisible();
    await expect(page.getByText('Guide')).toBeVisible();
    await expect(page.getByText('Load Sample')).toBeVisible();
  });

  test('tutorial shows guide steps', async ({ page }) => {
    const tutorialBtn = page.getByTitle(/Open the tutorial guide/i);
    await tutorialBtn.click();

    await expect(page.getByText(/Drag & Drop Resources/i)).toBeVisible();
    await expect(page.getByText(/Nest Inside Containers/i)).toBeVisible();
    await expect(page.getByText(/Connect with Network Rules/i)).toBeVisible();
    await expect(page.getByText(/Generate Infrastructure Code/i)).toBeVisible();
  });

  test('tutorial can switch to samples tab', async ({ page }) => {
    const tutorialBtn = page.getByTitle(/Open the tutorial guide/i);
    await tutorialBtn.click();

    await page.getByText('Load Sample').click();

    // Category headers should be visible
    await expect(page.getByText('Infrastructure Basics')).toBeVisible();
    await expect(page.getByText('Multi-Cloud & Aviatrix')).toBeVisible();
    await expect(page.getByText('Security Products')).toBeVisible();
    await expect(page.getByText('AI Workloads')).toBeVisible();
  });

  test('tutorial can be closed', async ({ page }) => {
    const tutorialBtn = page.getByTitle(/Open the tutorial guide/i);
    await tutorialBtn.click();
    await expect(page.getByText('Getting Started')).toBeVisible();

    // Close via Close button
    await page.getByTitle(/Close/i).click();
    await expect(page.getByText('Getting Started')).not.toBeVisible();
  });
});
