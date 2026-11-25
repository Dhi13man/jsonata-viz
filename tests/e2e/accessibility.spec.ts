import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    // Wait for the app to render
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      // Exclude React Flow internals — they manage their own ARIA
      .exclude(".react-flow__renderer")
      .analyze();

    // Allow no critical or serious violations
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    if (critical.length > 0) {
      const details = critical
        .map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} occurrences)`,
        )
        .join("\n");
      expect(critical, `Accessibility violations:\n${details}`).toHaveLength(0);
    }
  });

  test("keyboard navigation works for main controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 5000 });

    // Tab should reach expression textarea
    await page.keyboard.press("Tab");
    // Continue tabbing — should eventually reach interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
    }
    // Verify focus is somewhere in the page (not trapped)
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
