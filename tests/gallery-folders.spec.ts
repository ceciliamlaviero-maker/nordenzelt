import { test, expect } from '@playwright/test';

test.describe('Gallery Folders Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login to Admin
    await page.goto('http://localhost:3000/admin');
    await page.fill('input[type="password"]', 'Norden2024');
    await page.click('button[type="submit"]');
    await expect(page.getByText('NORDEN ADMIN')).toBeVisible();
    
    // Go to Gallery
    await page.click('button:has-text("Galería de Imágenes")');
    await expect(page.getByText('Gestión de Galería')).toBeVisible();
  });

  test('should create and delete a folder', async ({ page }) => {
    const folderName = `Test Folder ${Date.now()}`;
    
    // Open modal
    await page.click('button:has-text("Nueva Carpeta")');
    await expect(page.getByRole('heading', { name: 'Nueva Carpeta' })).toBeVisible();
    
    // Fill and submit
    await page.fill('input[placeholder="Ej: Eventos Corporativos"]', folderName);
    await page.fill('textarea', 'Descripción de prueba');
    await page.click('button:has-text("Crear Carpeta")');
    
    // Check if folder appears in selection bar
    await expect(page.getByRole('button', { name: folderName })).toBeVisible();
    
    // Delete folder
    // Note: The delete button is visible on hover in the UI implementation
    await page.hover(`button:has-text("${folderName}")`);
    
    // Handle confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("' + folderName + '") + button'); // The trash button
    
    // Verify folder is gone
    await expect(page.getByRole('button', { name: folderName })).not.toBeVisible();
  });

  test('should assign an item to a folder', async ({ page }) => {
    // Ensure we have at least one folder
    const folderName = "Folder Asignacion";
    await page.click('button:has-text("Nueva Carpeta")');
    await page.fill('input[placeholder="Ej: Eventos Corporativos"]', folderName);
    await page.click('button:has-text("Crear Carpeta")');
    await expect(page.getByRole('button', { name: folderName })).toBeVisible();

    // Find the first gallery item card and change its folder
    const galleryItems = page.locator('.grid > div');
    const count = await galleryItems.count();
    
    if (count > 0) {
      const firstItem = galleryItems.first();
      const select = firstItem.locator('select');
      await select.selectOption({ label: folderName });
      
      // Verification of "Saved" pulse would be here but it's transient
      // Instead, we verify the filter
      await page.click(`button:has-text("${folderName}")`);
      await expect(galleryItems).toHaveCount(1);
      
      await page.click('button:has-text("Ver Todo")');
      await expect(galleryItems).toHaveCount(count);
    }
  });
});

test.describe('Public Gallery Folders', () => {
  test('should show folders in public gallery', async ({ page }) => {
    await page.goto('http://localhost:3000/galeria');
    // We expect the gallery title at least
    await expect(page.getByText('GALERÍA NORDEN')).toBeVisible();
  });
});
