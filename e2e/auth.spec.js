import { test, expect } from '@playwright/test';

test.describe('auth stuff', () => {
  test('can see login form', async ({ page }) => {
    // go to frontend
    await page.goto('http://localhost:5173/login');
    
    // check if it loaded
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('complains when empty', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // click sign in blindly
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // check if html validation yells
    const emailInput = page.getByPlaceholder('Email address');
    const isRequired = await emailInput.evaluate((el) => el.required);
    expect(isRequired).toBeTruthy();
  });
});
