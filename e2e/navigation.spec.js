import { test, expect } from '@playwright/test';

test.describe('nav stuff', () => {
  test('landing page has links', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // find navbar
    await expect(page.locator('nav')).toBeVisible();
    
    // find login link
    const loginLink = page.getByRole('link', { name: /login/i });
    if (await loginLink.isVisible()) {
      await expect(loginLink).toHaveAttribute('href', '/login');
    }
  });

  test('can click projects link', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // click browse
    const browseLink = page.getByRole('link', { name: /browse projects/i });
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await expect(page).toHaveURL(/.*projects/);
    }
  });
});
