import { test, expect } from '@playwright/test';

test('Login Page', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
});
