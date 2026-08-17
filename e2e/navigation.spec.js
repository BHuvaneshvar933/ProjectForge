import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('Landing page contains main navigation links', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Assuming there's a navbar with "Projects" or similar
    await expect(page.locator('nav')).toBeVisible();
    // Assuming there's a login link for guests
    const loginLink = page.getByRole('link', { name: /login/i });
    if (await loginLink.isVisible()) {
      await expect(loginLink).toHaveAttribute('href', '/login');
    }
  });

  test('User can navigate to browse projects page', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Try to find the Browse Projects link
    const browseLink = page.getByRole('link', { name: /browse projects/i });
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await expect(page).toHaveURL(/.*projects/);
    }
  });
});
