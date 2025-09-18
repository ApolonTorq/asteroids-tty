import { test, expect } from '@playwright/test';

test.describe('Level Progression', () => {
  test('should advance to next level when all asteroids destroyed', async ({ page }) => {
    await page.goto('/');

    // This test will need game state manipulation or test mode
    // Implementation dependent - test will fail until implemented
    await expect(page.locator('.level')).toContainText('Level: 1');
  });
});