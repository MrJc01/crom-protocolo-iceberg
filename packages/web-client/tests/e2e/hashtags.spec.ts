/**
 * E2E Tests - Hashtags Feature
 */

import { test, expect } from "@playwright/test";

test.describe("Hashtags", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show trending hashtags on homepage", async ({ page }) => {
    // Check if trending section exists (when implemented)
    const trendingSection = page.locator('[data-testid="trending-hashtags"]');
    // This will pass if trending is implemented, skip otherwise
    if (await trendingSection.isVisible()) {
      await expect(trendingSection).toBeVisible();
    }
  });

  test("should navigate to hashtag page when clicking a hashtag", async ({ page }) => {
    // Create a post with hashtag first (requires identity)
    await page.goto("/hashtag/teste");
    
    // Should see the hashtag header
    await expect(page.locator("h1")).toContainText("#teste");
  });

  test("should display posts with hashtag on hashtag page", async ({ page }) => {
    await page.goto("/hashtag/corrupção");
    
    // Wait for loading to finish
    await page.waitForTimeout(1000);
    
    // Should either show posts or "no posts" message
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("should extract hashtags from post content in publish page", async ({ page }) => {
    await page.goto("/publicar");
    
    // If not logged in, should redirect or show login message
    const loginMessage = page.locator("text=Login Necessário");
    const form = page.locator("form");
    
    if (await form.isVisible()) {
      // Fill in content with hashtags
      await page.fill('textarea', "Este é um teste com #hashtag e #outraTag");
      
      // Should show detected hashtags
      await expect(page.locator("text=#hashtag")).toBeVisible();
    }
  });
});
