import { test, expect } from '@playwright/test';

test.describe('App Shell', () => {
  test('loads the main page with top navigation', async ({ page }) => {
    await page.goto('/');
    // TopNav should be visible with the Cloud Orchestrator dropdown
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('select.view-selector')).toBeVisible();
  });

  test('displays the resource sidebar', async ({ page }) => {
    await page.goto('/');
    // Sidebar should show the Resources header
    await expect(page.getByText('Resources')).toBeVisible();
    await expect(page.getByPlaceholder('Search blocks...')).toBeVisible();
  });

  test('shows AWS, Azure, and GCP provider sections in sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('AWS')).toBeVisible();
    await expect(page.getByText('Azure')).toBeVisible();
    await expect(page.getByText('Google Cloud')).toBeVisible();
  });

  test('sidebar search filters resources', async ({ page }) => {
    await page.goto('/');
    const searchBox = page.getByPlaceholder('Search blocks...');
    await searchBox.fill('EKS');
    // EKS should be visible, but unrelated items shouldn't show their section if no match
    await expect(page.getByText('EKS Cluster')).toBeVisible();
  });
});
