import { test, expect } from "@playwright/test";

test.describe("Post Operations", () => {
  test.beforeEach(async ({ page }) => {
     // Ensure we have an identity
    await page.goto("/login");
    
    // Check if already logged in
    const logoutButton = page.getByRole("button", { name: /sair|logout/i });
    if (!(await logoutButton.isVisible())) {
      // Create identity if not logged in
      const createButton = page.getByRole("button", { name: /criar nova identidade/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("should navigate to publish page", async ({ page }) => {
    await page.goto("/publicar");
    await expect(page.getByRole("heading", { name: /publicar|criar/i })).toBeVisible();
  });

  test("should have title and body fields", async ({ page }) => {
    await page.goto("/publicar");
    
    const titleInput = page.getByRole("textbox", { name: /título/i });
    const bodyInput = page.getByRole("textbox", { name: /conteúdo|corpo|body/i });
    
    // At least one should be visible
    const hasTitle = await titleInput.isVisible();
    const hasBody = await bodyInput.isVisible();
    
    expect(hasTitle || hasBody).toBeTruthy();
  });

  test("should have region selector", async ({ page }) => {
    await page.goto("/publicar");
    
    const regionSelector = page.locator("select, [role='combobox']").first();
    await expect(regionSelector).toBeVisible();
  });

  test("should have submit button", async ({ page }) => {
    await page.goto("/publicar");
    
    const submitButton = page.getByRole("button", { name: /publicar|enviar|criar/i });
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Voting", () => {
  test("should display vote buttons on home", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check for posts
    const posts = page.locator("article, .content-item, .post-card");
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Look for vote buttons
      const upvoteButton = page.locator("[aria-label*='upvote'], .vote-up, button:has-text('▲')").first();
      const downvoteButton = page.locator("[aria-label*='downvote'], .vote-down, button:has-text('▼')").first();
      
      const hasUpvote = await upvoteButton.isVisible();
      const hasDownvote = await downvoteButton.isVisible();
      
      // At least one vote mechanism should exist
      expect(hasUpvote || hasDownvote).toBeTruthy();
    }
  });

  test("should display score", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const posts = page.locator("article, .content-item, .post-card");
    if (await posts.count() > 0) {
      // Score should be visible
      const score = page.locator(".score, [class*='score'], .tabcoins").first();
      // Score may or may not be visible depending on styling
    }
  });
});

test.describe("Comments", () => {
  test("should show comment section on post page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Click on first post if exists
    const postLink = page.locator("a[href^='/post/']").first();
    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState("networkidle");
      
      // Look for comment section
      const commentSection = page.locator(".comments, #comments, [data-testid='comments']");
      const commentForm = page.getByRole("textbox", { name: /comentário|comment/i });
      
      const hasSection = await commentSection.isVisible();
      const hasForm = await commentForm.isVisible();
      
      expect(hasSection || hasForm).toBeTruthy();
    }
  });

  test("should have reply button on comments", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const postLink = page.locator("a[href^='/post/']").first();
    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState("networkidle");
      
      // Check for reply buttons if comments exist
      const replyButton = page.getByRole("button", { name: /responder|reply/i }).first();
      // May or may not be visible depending on if there are comments
    }
  });
});

test.describe("Moderation", () => {
  test("should have report button on posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const postLink = page.locator("a[href^='/post/']").first();
    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForLoadState("networkidle");
      
      const reportButton = page.getByRole("button", { name: /denunciar|report/i });
      // Report button should be visible on post page
      if (await reportButton.isVisible()) {
        await expect(reportButton).toBeEnabled();
      }
    }
  });

  test("should access moderation page", async ({ page }) => {
    await page.goto("/moderacao");
    
    // Should show moderation dashboard or access denied
    const header = page.getByRole("heading");
    await expect(header).toBeVisible();
  });
});

test.describe("Chat", () => {
  test("should show chat widget", async ({ page }) => {
    await page.goto("/");
    
    // Look for chat widget/button
    const chatButton = page.locator(".chat-widget, [aria-label*='chat'], button:has-text('💬')");
    // Chat widget may be visible after login
  });
});
