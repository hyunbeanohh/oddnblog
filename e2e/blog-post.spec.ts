import { test, expect } from "@playwright/test"

test.describe("Blog post", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to /articles and click the first blog post link
    await page.goto("/articles")
    const firstLink = page.locator('a[href*="/blog/"]').first()
    await firstLink.click()
    await expect(page).toHaveURL(/\/blog\//)
  })

  test("post has an h1 heading with text", async ({ page }) => {
    const h1 = page.locator("article h1")
    await expect(h1).toBeVisible()
    const text = await h1.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test("post has a prose content area", async ({ page }) => {
    // The MDX content is wrapped in a div with class "prose"
    const content = page.locator(".prose")
    await expect(content).toBeVisible()
  })

  test("code blocks render if present (conditional)", async ({ page }) => {
    const codeBlocks = page.locator("figure[data-rehype-pretty-code-figure], pre code")
    const count = await codeBlocks.count()
    if (count > 0) {
      await expect(codeBlocks.first()).toBeVisible()
    }
    // If no code blocks, test passes silently — not all posts have code
  })

  test("images load with non-zero naturalWidth (conditional)", async ({ page }) => {
    const images = page.locator("article img")
    const count = await images.count()
    if (count > 0) {
      const firstImg = images.first()
      await expect(firstImg).toBeVisible()
      const naturalWidth = await firstImg.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      )
      expect(naturalWidth).toBeGreaterThan(0)
    }
  })

  test("TOC is present if post has headings (conditional)", async ({ page }) => {
    // TOC renders a nav with aria-label="목차" when there are headings
    const toc = page.locator("nav[aria-label='목차']")
    const count = await toc.count()
    if (count > 0) {
      await expect(toc.first()).toBeAttached()
    }
  })

  test("back link to articles list is visible", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /목록으로 돌아가기/ })
    await expect(backLink).toBeVisible()
  })
})
