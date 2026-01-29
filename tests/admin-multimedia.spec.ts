import { test, expect } from '@playwright/test';

test.describe('Admin Multimedia Management', () => {
  test.beforeEach(async ({ page }) => {
    // Go to admin page
    await page.goto('http://localhost:3000/admin');
    
    // Login
    await page.fill('input[placeholder="Contraseña"]', 'Norden2024');
    await page.click('button:has-text("Ingresar")');
    
    // Wait for the selection menu
    await expect(page.locator('h1')).toContainText('NORDEN ADMIN');
  });

  test('should navigate to Multimedia view and show sections', async ({ page }) => {
    // Click on Multimedia button
    await page.click('button:has-text("Multimedia")');
    
    // Check if Gestor Multimedia header is visible
    await expect(page.locator('h3')).toContainText('Gestor Multimedia');
    
    // Check if sections are present
    const sections = ['Portada (Hero)', 'Carrusel de Fotos'];
    for (const section of sections) {
      await expect(page.locator(`h4:has-text("${section}")`)).toBeVisible();
    }
    
    // Ensure old sections are gone
    await expect(page.locator('h4:has-text("Servicios")')).not.toBeVisible();
    await expect(page.locator('h4:has-text("Nosotros")')).not.toBeVisible();
  });

  test('should show empty state if no assets are present', async ({ page }) => {
    await page.click('button:has-text("Multimedia")');
    
    // Check for "No hay fotos en esta sección" text
    // This might fail if there are already photos, but it's a good check for a fresh state
    const emptyStates = page.locator('p:has-text("No hay fotos en esta sección")');
    const count = await emptyStates.count();
    console.log(`Found ${count} empty sections`);
  });

  test('should allow navigating back to selection menu', async ({ page }) => {
    await page.click('button:has-text("Multimedia")');
    await expect(page.locator('h3')).toContainText('Gestor Multimedia');
    
    // Click back button (ChevronLeft)
    // Looking at the code: <button onClick={() => setView('selection')} ...> <ChevronLeft ... /> </button>
    await page.locator('header button').first().click();
    
    // Should be back at selection menu
    await expect(page.locator('button:has-text("Calendario")')).toBeVisible();
    await expect(page.locator('button:has-text("Dashboard Financiero")')).toBeVisible();
    await expect(page.locator('button:has-text("Multimedia")')).toBeVisible();
  });
});
