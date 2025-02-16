import { test, expect } from '@playwright/test';

test.describe('CRUD Recipes', () => {
  test('Crear una nueva receta ', async ({ page }) => {
    // 1. Simular el login
    await page.goto('http://localhost:3000/fake-login'); // Ajusta la URL si es necesario
    await page.fill('input[name="email"]', 'me@example.com');
    await page.click('button[type="submit"]');

    // 2. Verificar que la redirección ocurra a /app
    await page.waitForURL('http://localhost:3000/app');

    // 3. Navegar a la página de recetas
    await page.goto('http://localhost:3000/app/recipes');

    // 4. Hacer clic en el botón "Create New Recipe"
    await page.click('button[name="_action"][value="createRecipe"]');

    // 5. Esperar la redirección a la nueva receta
    await page.waitForURL(/\/app\/recipes\/.+/); // La URL debe terminar en un ID dinámico

    // 6. Verificar que la nueva receta tenga los valores predeterminados
    const timeLocator = page.locator('h3').first(); // Busca el párrafo dentro de la página
    await expect(timeLocator).toHaveText('New Recipe');
  });

  test('Actualizar nombre de una receta', async ({ page }) => {
    // 1. Simular el login
    await page.goto('http://localhost:3000/fake-login');
    await page.fill('input[name="email"]', 'me@example.com');
    await page.click('button[type="submit"]');

    // 2. Verificar que la redirección ocurra a /app
    await page.waitForURL('http://localhost:3000/app');

    // 3. Navegar a la página de recetas
    await page.goto('http://localhost:3000/app/recipes');

    // 4. Verificar que la nueva receta tenga los valores predeterminados
    const recipeTitle = page.locator('h3').first();
    await expect(recipeTitle).toHaveText('New Recipe');

    // 5. Abrir la receta
    await recipeTitle.click();
    await page.waitForURL(/\/app\/recipes\/.+/);

    // 6. Seleccionar y modificar el nombre de la receta
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue('New Recipe'); // Asegurar el valor inicial
    await nameInput.fill('Updated Recipe'); // Escribir nuevo nombre

    // 7. Guardar los cambios
    await page.click('button[name="_action"][value="saveRecipe"]');

    // 8. Esperar a que el campo se actualice y verificar el cambio
    await page.waitForSelector('input[name="name"][value="Updated Recipe"]');
    await expect(nameInput).toHaveValue('Updated Recipe');
  });

  //test('Eliminar una receta', async ({ page }) => {});
});
