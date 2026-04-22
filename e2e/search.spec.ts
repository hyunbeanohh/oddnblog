import { test, expect } from "@playwright/test"

test.describe("Search overlay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    // Wait for React hydration so click handlers are attached
    await page.waitForFunction(() => {
      const btn = document.querySelector("button[aria-label='검색']")
      return btn !== null
    })
    await page.waitForTimeout(500)
  })

  test("search button is visible in header", async ({ page }) => {
    const searchBtn = page.getByRole("button", { name: "검색" })
    await expect(searchBtn).toBeVisible()
  })

  test("clicking search button opens the search overlay", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()
    const searchInput = page.getByPlaceholder("검색어를 입력하세요...")
    await expect(searchInput).toBeVisible()
  })

  test("search overlay shows empty state text when open with no input", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()
    await expect(page.getByText("검색어를 입력하면 글을 찾아드려요")).toBeVisible()
  })

  test("pressing Escape closes the search overlay", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()
    const searchInput = page.getByPlaceholder("검색어를 입력하세요...")
    await expect(searchInput).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(searchInput).not.toBeVisible()
  })

  test("clicking close button closes the search overlay", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()
    const searchInput = page.getByPlaceholder("검색어를 입력하세요...")
    await expect(searchInput).toBeVisible()

    // Close button is inside the overlay next to the input
    // It's a button containing the CloseIcon (no aria-label, but it's the only button inside the overlay row)
    const overlay = page.locator(".fixed.inset-0").first()
    const closeBtn = overlay.locator("button").last()
    await closeBtn.click()

    await expect(searchInput).not.toBeVisible()
  })

  test("typing a query shows results or no-results message", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()

    const searchInput = page.getByPlaceholder("검색어를 입력하세요...")
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    await searchInput.fill("Cloudflare")
    // Wait for debounce (150ms) + render
    await page.waitForTimeout(600)

    // Either results appear under "Local title search" OR a no-results message appears
    const localSection = page.getByText("Local title search")
    const noResults = page.getByText("에 대한 결과가 없습니다")
    const hasLocal = await localSection.isVisible().catch(() => false)
    const hasNoResults = await noResults.isVisible().catch(() => false)

    expect(hasLocal || hasNoResults).toBe(true)
  })

  test("typing a nonsense query shows no-results message", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click()
    const searchInput = page.getByPlaceholder("검색어를 입력하세요...")

    await searchInput.fill("xyzzyabcdefghijklmnopqrstuvwxyz12345")
    await page.waitForTimeout(400)

    // Semantic search will fail (no API in static mode) and local title search won't match
    await expect(page.getByText("에 대한 결과가 없습니다")).toBeVisible()
  })
})
