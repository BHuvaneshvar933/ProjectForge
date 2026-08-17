import { test, expect } from '@playwright/test';

test.describe('Authentication Journey', () => {
  test('User can navigate to login and see the form', async ({ page }) => {
    // Navigate to the frontend (assuming it runs on port 5173 for local tests)
    await page.goto('http://localhost:5173/login');
    
    // Expect the login form to be visible
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('Shows validation errors on empty submission', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Click sign in without filling
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check if the HTML5 validation kicks in
    const emailInput = page.getByPlaceholder('Email address');
    const isRequired = await emailInput.evaluate((el) => el.required);
    expect(isRequired).toBeTruthy();
  });
});
