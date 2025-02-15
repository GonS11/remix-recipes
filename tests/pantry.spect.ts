import { test, expect } from '@playwright/test';

test('Redirect if uesr not looged in', async ({ page }) => {
  await page.goto('/app/pantry');
  await expect(page.getByRole('button', { name: /log in/i }));
});
