import { test, expect } from "@playwright/test"

test.describe("Dark mode", () => {
  const toggleSelector = "header button[aria-label*='모드로 전환']"

  test("theme toggle button is visible in header", async ({ page }) => {
    await page.goto("/")
    const toggleBtn = page.locator(toggleSelector)
    await expect(toggleBtn).toBeVisible()
  })

  test("clicking toggle changes data-theme attribute", async ({ page }) => {
    await page.goto("/")
    const html = page.locator("html")
    const toggleBtn = page.locator(toggleSelector)

    // Wait for hydration — data-theme should be set by useEffect
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-theme")
    )

    const initialTheme = await html.getAttribute("data-theme")

    await toggleBtn.click()

    // Use waitForFunction to reliably detect attribute change
    const expectedTheme = initialTheme === "dark" ? "light" : "dark"
    await page.waitForFunction(
      expected => document.documentElement.getAttribute("data-theme") === expected,
      expectedTheme,
      { timeout: 5000 }
    )
  })

  test("dark mode persists across navigation", async ({ page }) => {
    await page.goto("/")
    const toggleBtn = page.locator(toggleSelector)

    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-theme")
    )

    const initialTheme = await page.locator("html").getAttribute("data-theme")
    await toggleBtn.click()

    const expectedTheme = initialTheme === "dark" ? "light" : "dark"
    await page.waitForFunction(
      expected => document.documentElement.getAttribute("data-theme") === expected,
      expectedTheme,
      { timeout: 5000 }
    )

    // Navigate and verify persistence
    await page.goto("/articles")
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-theme")
    )
    const themeAfterNav = await page.locator("html").getAttribute("data-theme")
    expect(themeAfterNav).toBe(expectedTheme)
  })

  test("background color changes between light and dark modes", async ({
    page,
  }) => {
    await page.goto("/")
    const toggleBtn = page.locator(toggleSelector)

    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-theme")
    )

    const bgBefore = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    )

    await toggleBtn.click()

    // Wait for theme change to complete
    await page.waitForFunction(
      oldBg => window.getComputedStyle(document.body).backgroundColor !== oldBg,
      bgBefore,
      { timeout: 5000 }
    )
  })
})
