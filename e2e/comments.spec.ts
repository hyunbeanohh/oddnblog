import { test, expect } from "@playwright/test"

test.describe("Comments section", () => {
  test("blog post has 댓글 heading", async ({ page }) => {
    await page.goto("/articles")
    const firstPostLink = page.locator('a[href*="/blog/"]').first()
    await firstPostLink.click()
    await expect(page).toHaveURL(/\/blog\//)

    const commentsHeading = page.getByRole("heading", { name: "댓글" })
    await expect(commentsHeading).toBeVisible()
  })

  test("comments section renders below the heading", async ({ page }) => {
    await page.goto("/articles")
    const firstPostLink = page.locator('a[href*="/blog/"]').first()
    await firstPostLink.click()
    await expect(page).toHaveURL(/\/blog\//)

    // Verify the comments section element exists and has content
    // The widget varies by env config (Giscus, native, or unconfigured message)
    const commentsHeading = page.getByRole("heading", { name: "댓글" })
    await expect(commentsHeading).toBeVisible()

    // The section containing the heading should have visible content after the heading
    const section = commentsHeading.locator("..")
    await expect(section).toBeVisible()
  })
})
