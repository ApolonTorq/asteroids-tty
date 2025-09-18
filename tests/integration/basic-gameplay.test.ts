import { test, expect } from '@playwright/test';

// Integration test for basic gameplay scenario
test.describe('Basic Gameplay Scenario', () => {
  test('should allow player to control spaceship and shoot asteroids', async ({ page }) => {
    // This will fail until we implement the component
    await page.goto('/');

    // Wait for game to load
    await expect(page.locator('.asteroids-container')).toBeVisible();

    // Check initial game state
    await expect(page.locator('.score')).toContainText('Score: 0');
    await expect(page.locator('.level')).toContainText('Level: 1');
    await expect(page.locator('.lives')).toContainText('Lives: 3');

    // Test spaceship movement
    await page.keyboard.press('KeyW'); // Thrust
    await page.waitForTimeout(100);

    // Test rotation
    await page.keyboard.press('KeyA'); // Rotate left
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyD'); // Rotate right
    await page.waitForTimeout(100);

    // Test shooting
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Verify projectile exists
    const gameGrid = page.locator('.character-grid');
    await expect(gameGrid).toContainText('.');
  });
});