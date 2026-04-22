import { test, expect } from "@playwright/test"

test.describe("SEO — home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("page title contains 오또니", async ({ page }) => {
    await expect(page).toHaveTitle(/오또니/)
  })

  test("meta description exists and is non-empty", async ({ page }) => {
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(0)
  })

  test("og:title meta tag exists", async ({ page }) => {
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content")
    expect(ogTitle).toBeTruthy()
  })

  test("og:description meta tag exists", async ({ page }) => {
    const ogDesc = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content")
    expect(ogDesc).toBeTruthy()
  })

  test("og:type meta tag exists", async ({ page }) => {
    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content")
    expect(ogType).toBeTruthy()
  })

  test("og:url meta tag exists", async ({ page }) => {
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content")
    expect(ogUrl).toBeTruthy()
  })

  test("og:image meta tag exists", async ({ page }) => {
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content")
    expect(ogImage).toBeTruthy()
  })

  test("twitter:card is summary_large_image", async ({ page }) => {
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content")
    expect(twitterCard).toBe("summary_large_image")
  })

  test("canonical link tag exists", async ({ page }) => {
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href")
    expect(canonical).toBeTruthy()
  })
})

test.describe("SEO — robots.txt and sitemap", () => {
  test("/robots.txt returns 200", async ({ request }) => {
    const response = await request.get("/robots.txt")
    expect(response.status()).toBe(200)
  })

  test("/sitemap/sitemap-index.xml returns 200", async ({ request }) => {
    const response = await request.get("/sitemap/sitemap-index.xml")
    expect(response.status()).toBe(200)
  })
})

test.describe("SEO — blog post page", () => {
  test("blog post page has og:type = article", async ({ page }) => {
    // Use direct navigation instead of client-side routing
    // to ensure Gatsby Head API renders fresh meta tags
    await page.goto("/articles")
    const firstPostLink = page.locator('a[href*="/blog/"]').first()
    const href = await firstPostLink.getAttribute("href")

    // Navigate directly to the blog post URL (full page load)
    await page.goto(href!)
    await expect(page).toHaveURL(/\/blog\//)

    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content")
    expect(ogType).toBe("article")
  })
})
