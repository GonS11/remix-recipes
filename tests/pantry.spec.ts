import { test, expect } from '@playwright/test';

test('Redirect if user not logged in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
});
