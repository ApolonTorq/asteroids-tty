import { test, expect } from '@playwright/test';

test.describe('Traditional Mode', () => {
  test('should switch to traditional asteroids physics', async ({ page }) => {
    await page.goto('/');

    // Toggle to traditional mode
    await page.keyboard.press('KeyM');

    // Verify mode change
    await expect(page.locator('.physics-mode')).toContainText('traditional');

    // Screen should not scroll in traditional mode
    await page.waitForTimeout(1000);
  });
});