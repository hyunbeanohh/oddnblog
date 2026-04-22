import { test, expect } from "@playwright/test"

test.describe("Responsive layout", () => {
  test("mobile (375x812) main content is visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "최신 아티클" })
    ).toBeVisible()
  })

  test("tablet (768x1024) page loads OK and shows content", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "최신 아티클" })
    ).toBeVisible()
  })

  test("desktop has nav links visible (Articles)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")

    await expect(page.getByRole("link", { name: "Articles" })).toBeVisible()
  })

  test("desktop has search button visible in header", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")

    await expect(page.getByRole("button", { name: "검색" })).toBeVisible()
  })

  test("mobile blog post is readable (content visible at 375px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto("/articles")
    const firstPostLink = page.locator('a[href*="/blog/"]').first()
    await firstPostLink.click()
    await expect(page).toHaveURL(/\/blog\//)

    const article = page.locator("article")
    await expect(article).toBeVisible()

    const h1 = page.locator("article h1")
    await expect(h1).toBeVisible()
  })
})
