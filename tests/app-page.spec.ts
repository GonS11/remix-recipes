import { test, expect } from '@playwright/test';

test('Login simulado y redirección a /app', async ({ page }) => {
  // Navegar a la ruta de fake-login
  await page.goto('http://localhost:3000/fake-login'); // Ajusta la URL si es necesario

  // Ingresar el email en el formulario
  await page.fill('input[name="email"]', 'me@example.com');

  // Enviar el formulario
  await page.click('button[type="submit"]');

  // Verificar que la redirección ocurra a /app
  await expect(page).toHaveURL('http://localhost:3000/app'); // Ajusta la URL según corresponda

  // Verificar que el contenido de la página /app esté cargado
  const newCreateContent = await page.textContent('h1'); // Ajusta el selector según el contenido de /app
  expect(newCreateContent).toContain('App'); // O el contenido que esperes encontrar en la página /app
});
