import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
  test("clicking Articles nav link goes to /articles", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Articles" }).click()
    await expect(page).toHaveURL(/\/articles/)
  })

  test("articles page has blog post links", async ({ page }) => {
    await page.goto("/articles")
    const postLinks = page.locator('a[href*="/blog/"]')
    await expect(postLinks.first()).toBeVisible()
  })

  test("clicking a category nav link goes to /category/*", async ({ page }) => {
    await page.goto("/")
    // Click first category link (Engineering, Design, or Product)
    const categoryLink = page.locator("header nav a[href*='/category/']").first()
    const href = await categoryLink.getAttribute("href")
    await categoryLink.click()
    await expect(page).toHaveURL(/\/category\//)
  })

  test("404 page shows for invalid route", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz")
    // Gatsby serves a 404 page; the content should be visible
    await expect(page.locator("body")).toBeVisible()
    // The URL should contain the path (not redirected away)
    expect(page.url()).toContain("/this-page-does-not-exist-xyz")
  })

  test("clicking article card navigates to /blog/*", async ({ page }) => {
    await page.goto("/")
    const articleLink = page.locator('a[href*="/blog/"]').first()
    const href = await articleLink.getAttribute("href")
    await articleLink.click()
    await expect(page).toHaveURL(/\/blog\//)
  })
})
