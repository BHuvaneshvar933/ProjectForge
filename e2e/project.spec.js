import { test, expect } from '@playwright/test';

test.describe('project stuff', () => {
  test('blocks rando from making project', async ({ page }) => {
    // try to bypass login
    await page.goto('http://localhost:5173/projects/new');
    
    // bounce to login
    await expect(page).toHaveURL(/.*login/);
  });
});
