import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("page title contains 오또니", async ({ page }) => {
    await expect(page).toHaveTitle(/오또니/)
  })

  test("has hero carousel section", async ({ page }) => {
    // The FeaturedHero renders a <section> as the first section on the page
    const heroSection = page.locator("section").first()
    await expect(heroSection).toBeVisible()
  })

  test("shows 최신 아티클 heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "최신 아티클" })).toBeVisible()
  })

  test("has article cards with links to /blog/*", async ({ page }) => {
    const articleLinks = page.locator('a[href*="/blog/"]')
    await expect(articleLinks.first()).toBeVisible()
  })

  test("shows 인기 있는 글 sidebar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "인기 있는 글" })).toBeVisible()
  })

  test("shows 최신 댓글 sidebar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "최신 댓글" })).toBeVisible()
  })

  test("logo link points to /", async ({ page }) => {
    const logo = page.locator("header a").first()
    await expect(logo).toHaveAttribute("href", "/")
  })
})
