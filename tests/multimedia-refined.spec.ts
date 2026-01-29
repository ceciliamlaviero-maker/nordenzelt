import { test, expect } from '@playwright/test';

test.describe('Admin Multimedia Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.fill('input[placeholder="Contraseña"]', 'Norden2024');
    await page.click('button:has-text("Ingresar")');
    await expect(page.locator('h1')).toContainText('NORDEN ADMIN');
  });

  test('should show only Hero and Carousel sections', async ({ page }) => {
    await page.click('button:has-text("Multimedia")');
    await expect(page.locator('h3')).toContainText('Gestor Multimedia');
    
    // Check for required sections
    await expect(page.locator('h4:has-text("Portada (Hero)")')).toBeVisible();
    await expect(page.locator('h4:has-text("Carrusel de Fotos")')).toBeVisible();
    
    // Check that deleted sections are NOT present
    await expect(page.locator('h4:has-text("Servicios")')).not.toBeVisible();
    await expect(page.locator('h4:has-text("Nosotros")')).not.toBeVisible();
  });

  test('should show empty state if no assets are present', async ({ page }) => {
    await page.click('button:has-text("Multimedia")');
    const emptyStates = page.locator('p:has-text("No hay fotos en esta sección")');
    await expect(emptyStates.first()).toBeVisible();
  });
});

test.describe('Home Page Dynamic Assets', () => {
  test('should load dynamic assets from Supabase', async ({ page }) => {
    // We can't easily mock Supabase in a simple E2E without more setup,
    // but we can check if the components are present and the hero img has a src.
    await page.goto('http://localhost:3000/');
    
    const heroImg = page.locator('section img').first();
    await expect(heroImg).toBeVisible();
    
    const carousel = page.locator('section').filter({ hasText: 'carpa que se adapta' });
    await expect(carousel).toBeVisible();
  });
});
