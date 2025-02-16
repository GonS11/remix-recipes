import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link').nth(1).click();
  await page.getByRole('textbox', { name: 'Color theme' }).click();
  await page.getByRole('textbox', { name: 'Color theme' }).fill('#5ac492');
  await page.getByText('Color themeSave').click();
  await page.getByRole('button', { name: 'Save' }).click();
});
