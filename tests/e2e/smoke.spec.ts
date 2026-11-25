import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Visionata/);
  });

  test("canvas and bottom panel are visible", async ({ page }) => {
    await page.goto("/");
    // React Flow canvas should be present
    await expect(page.locator(".react-flow")).toBeVisible();
    // Bottom panel with expression textarea
    await expect(page.getByLabel("JSONata Expression")).toBeVisible();
    // JSON Input textarea
    await expect(page.getByLabel("JSON Input")).toBeVisible();
  });

  test("status bar shows client-side indicator", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Client-side only")).toBeVisible();
  });

  test("default expression renders nodes on canvas", async ({ page }) => {
    await page.goto("/");
    // Wait for React Flow nodes to appear
    await expect(page.locator(".react-flow__node").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("editing expression updates output", async ({ page }) => {
    await page.goto("/");
    const exprTextarea = page.getByLabel("JSONata Expression");
    await exprTextarea.fill("42");
    // Output should show 42
    await expect(page.getByLabel("Evaluation Output")).toContainText("42", {
      timeout: 5000,
    });
  });
});
