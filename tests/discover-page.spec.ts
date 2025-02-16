import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link').first().click();
  await page
    .getByRole('link', { name: 'Buttermilk Pancakes Pepe Perez' })
    .click();
  await page.getByText('min').click();
  await page.getByRole('heading', { name: 'Buttermilk Pancakes' }).click();
});
