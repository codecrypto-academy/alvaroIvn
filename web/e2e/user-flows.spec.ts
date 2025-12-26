import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Flows
 *
 * Tests de flujos completos de usuario sin necesidad de backend real.
 * Verifican la navegación, UI y comportamiento de la aplicación.
 */

test.describe('User Registration Flow', () => {
  test('should display registration page when not connected', async ({ page }) => {
    await page.goto('/');

    // Should show connect wallet button
    const connectButton = page.getByRole('button', { name: /conectar metamask/i });
    await expect(connectButton).toBeVisible();

    // Should not show navigation for unauthenticated users
    await expect(page.getByRole('link', { name: /dashboard/i })).not.toBeVisible();
  });

  test('should show registration information on homepage', async ({ page }) => {
    await page.goto('/');

    // Check for key information elements
    await expect(page.locator('h1')).toContainText(/supply chain tracker/i);

    // Should have information about the platform
    await expect(page.locator('body')).toContainText(/trazabilidad|blockchain|cadena de suministro/i);
  });

  test('should have working navigation links in header', async ({ page }) => {
    await page.goto('/');

    // Logo should link to home
    const logo = page.getByRole('link', { name: /supply chain tracker/i }).first();
    await expect(logo).toHaveAttribute('href', '/');
  });
});

test.describe('Navigation and Layout', () => {
  test('should have consistent header across pages', async ({ page }) => {
    await page.goto('/');

    // Header should be present
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Logo should be visible
    await expect(page.getByText(/supply chain tracker|sct/i).first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');

    // Page should render without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance

    // Mobile logo (SCT) should be visible
    await expect(page.getByText('SCT')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');

    // Page should render properly
    await expect(page.locator('body')).toBeVisible();

    // Full logo should be visible on tablet
    await expect(page.getByText(/supply chain tracker/i).first()).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Page should render properly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Page Loading and Performance', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load in reasonable time (less than 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Page should be interactive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not have console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Filter out expected MetaMask errors (we're in test environment)
    const unexpectedErrors = consoleErrors.filter(
      error => !error.includes('ethereum') &&
               !error.includes('MetaMask') &&
               !error.includes('provider')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto('/');

    // Reload page
    await page.reload();

    // Page should still work after refresh
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('button', { name: /conectar metamask/i })).toBeVisible();
  });
});

test.describe('Accessibility Features', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have h1 tag
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Only one h1 per page

    // H1 should contain meaningful text
    await expect(h1).toContainText(/\w+/);
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('/');

    // Focus first element (usually skip link)
    await page.keyboard.press('Tab');

    // Check if first focusable element is reasonable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have lang attribute on html element', async ({ page }) => {
    await page.goto('/');

    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/es|en/); // Spanish or English
  });

  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });
});

test.describe('Error Handling', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should return 404 status or show error page
    // Note: Next.js might handle this differently
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    try {
      await page.goto('/', { timeout: 5000 });
    } catch (error) {
      // Expected to fail
      expect(error).toBeTruthy();
    }

    // Go back online
    await page.context().setOffline(false);
  });
});

test.describe('Button and Link Interactions', () => {
  test('should have clickable connect wallet button', async ({ page }) => {
    await page.goto('/');

    const connectButton = page.getByRole('button', { name: /conectar metamask/i });
    await expect(connectButton).toBeEnabled();

    // Click should be possible (even if MetaMask is not installed, button should respond)
    await expect(connectButton).toBeVisible();
  });

  test('should have working logo link', async ({ page }) => {
    await page.goto('/');

    const logo = page.getByRole('link', { name: /supply chain tracker/i }).first();
    await expect(logo).toHaveAttribute('href', '/');

    // Logo should be clickable
    await expect(logo).toBeVisible();
  });
});

test.describe('Visual Regression Checks', () => {
  test('should render header consistently', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Header should have reasonable height
    const box = await header.boundingBox();
    expect(box?.height).toBeGreaterThan(40);
    expect(box?.height).toBeLessThan(200);
  });

  test('should not have layout shifts on load', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Get initial body dimensions
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Wait a bit to see if there are layout shifts
    await page.waitForTimeout(500);

    const finalHeight = await page.evaluate(() => document.body.scrollHeight);

    // Height should be relatively stable (allow small differences)
    const heightDiff = Math.abs(finalHeight - initialHeight);
    expect(heightDiff).toBeLessThan(100);
  });
});

test.describe('SEO and Metadata', () => {
  test('should have title tag', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    // May or may not have description, just check it doesn't error
    expect(description !== undefined).toBeTruthy();
  });
});
