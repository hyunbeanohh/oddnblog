import { test, expect } from "@playwright/test"

test.describe("External links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("GitHub link in header has correct href", async ({ page }) => {
    const githubLink = page.getByRole("link", { name: "GitHub 저장소" })
    await expect(githubLink).toBeVisible()
    const href = await githubLink.getAttribute("href")
    expect(href).toBe("https://github.com/hyunbeanohh/")
  })

  test("GitHub link opens in new tab (target=_blank)", async ({ page }) => {
    const githubLink = page.getByRole("link", { name: "GitHub 저장소" })
    const target = await githubLink.getAttribute("target")
    expect(target).toBe("_blank")
  })

  test("GitHub link has rel containing noopener", async ({ page }) => {
    const githubLink = page.getByRole("link", { name: "GitHub 저장소" })
    const rel = await githubLink.getAttribute("rel")
    expect(rel).toContain("noopener")
  })

  test("page source contains the site URL https://oddn.ai.kr", async ({ page }) => {
    const content = await page.content()
    expect(content).toContain("https://oddn.ai.kr")
  })
})
