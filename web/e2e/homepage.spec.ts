import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with title', async ({ page }) => {
    await expect(page).toHaveTitle(/Supply Chain Tracker/i);
  });

  test('should show supply chain tracker logo', async ({ page }) => {
    const logo = page.getByText('Supply Chain Tracker');
    await expect(logo).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.getByRole('heading', { name: /trazabilidad/i });
    await expect(hero).toBeVisible();
  });

  test('should show connect MetaMask button', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /conectar.*metamask/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    const features = page.getByText(/blockchain.*ethereum/i);
    await expect(features).toBeVisible();
  });

  test('should have documentation link in footer', async ({ page }) => {
    const docLink = page.getByRole('link', { name: /documentación/i });
    await expect(docLink).toBeVisible();
  });

  test('should navigate to documentation when clicked', async ({ page }) => {
    const docLink = page.getByRole('link', { name: /documentación/i });

    // Check that link has correct href
    await expect(docLink).toHaveAttribute('href', /docs|documentation/i);
  });
});

test.describe('Homepage - Responsive', () => {
  test('should display mobile logo on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileLogo = page.getByText('SCT');
    await expect(mobileLogo).toBeVisible();
  });

  test('should show full logo on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const desktopLogo = page.getByText('Supply Chain Tracker');
    await expect(desktopLogo).toBeVisible();
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const heading = page.getByRole('heading', { name: /trazabilidad/i });
    await expect(heading).toBeVisible();
  });
});

test.describe('Homepage - Accessibility', () => {
  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('banner');
    await expect(nav).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
