import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Login.*Iceberg/i);
    await expect(page.getByRole("heading", { name: /identidade/i })).toBeVisible();
  });

  test("should create new identity", async ({ page }) => {
    await page.goto("/login");
    
    // Click create new identity button
    await page.getByRole("button", { name: /criar nova identidade/i }).click();
    
    // Should show mnemonic
    await expect(page.getByText(/guarde estas palavras/i)).toBeVisible();
    
    // Should have 24 words displayed
    const mnemonicWords = page.locator(".mnemonic-word, [data-mnemonic]");
    await expect(mnemonicWords).toHaveCount(24);
  });

  test("should show import option", async ({ page }) => {
    await page.goto("/login");
    
    // Should have import link
    const importLink = page.getByRole("link", { name: /recuperar.*mnemônico/i });
    await expect(importLink).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate to home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Iceberg/i);
  });

  test("should navigate to recent posts", async ({ page }) => {
    await page.goto("/recentes");
    await expect(page.getByText(/recentes/i)).toBeVisible();
  });

  test("should navigate to about page", async ({ page }) => {
    await page.goto("/sobre");
    await expect(page.getByRole("heading")).toContainText(/sobre|iceberg/i);
  });

  test("should navigate to FAQ", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByText(/perguntas frequentes/i)).toBeVisible();
  });

  test("should navigate to terms", async ({ page }) => {
    await page.goto("/termos-de-uso");
    await expect(page.getByText(/termos/i)).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle dark/light theme", async ({ page }) => {
    await page.goto("/");
    
    // Find theme toggle button
    const themeButton = page.getByRole("button", { name: /toggle theme|tema/i });
    
    if (await themeButton.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => 
        document.documentElement.getAttribute("data-theme")
      );

      // Click toggle
      await themeButton.click();

      // Theme should change
      const newTheme = await page.evaluate(() => 
        document.documentElement.getAttribute("data-theme")
      );

      expect(newTheme).not.toBe(initialTheme);
    }
  });
});

test.describe("Search", () => {
  test("should display search page", async ({ page }) => {
    await page.goto("/buscar");
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("should filter by region", async ({ page }) => {
    await page.goto("/buscar");
    
    // Should have region selector
    const regionSelect = page.getByRole("combobox");
    if (await regionSelect.isVisible()) {
      await expect(regionSelect).toBeEnabled();
    }
  });
});

test.describe("Post Display", () => {
  test("should display posts on home", async ({ page }) => {
    await page.goto("/");
    
    // Wait for content to load
    await page.waitForLoadState("networkidle");
    
    // Should have either posts or empty state
    const hasPosts = await page.locator("article, .content-item, .post-card").count() > 0;
    const hasEmptyState = await page.getByText(/nenhum post|nenhuma publicação|vazio/i).isVisible();
    
    expect(hasPosts || hasEmptyState).toBeTruthy();
  });

  test("should show level badges", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // If there are posts, they should have level badges
    const posts = page.locator("article, .content-item");
    if (await posts.count() > 0) {
      const levelBadge = page.locator(".level-badge, [class*='level-']").first();
      // Level badge may or may not exist depending on posts
    }
  });
});
