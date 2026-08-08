import { test, expect } from "@playwright/test";

// The game mode used to be applied the moment the carousel moved. It is now
// staged in the modal like every other option and only travels on save.
test.describe("E2E: Game Mode Staging", () => {
  test("stages the mode until the host saves, and discards it on close", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#player-name").fill("HostStaging");
    await page.locator('[data-testid="create-room-btn"]').click();
    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible(
      {
        timeout: 15000,
      },
    );

    const openOptionsBtn = page
      .locator("button:has(svg.lucide-settings)")
      .first();
    const dialog = page.getByRole("dialog");
    const selectedMode = page.locator('[aria-live="polite"] p');

    // 1. Staging a spoken mode swaps which options are on screen...
    await openOptionsBtn.click();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(selectedMode).toHaveText(/Classic|Clásico|Clàssic/i);

    await page.getByRole("button", { name: /Select Original mode/i }).click();
    await expect(selectedMode).toHaveText(/^Original$/i);
    await expect(page.getByText("Drawing Time per Round")).toHaveCount(0);
    await expect(
      page.locator('[data-testid="hide-hint-section"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="turn-order-section"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="in-person-badge"]')).toBeVisible();

    // 2. ...but closing without saving throws the staged mode away
    await page.locator('[data-testid="close-modal-button"]').first().click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    await openOptionsBtn.click();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(selectedMode).toHaveText(/Classic|Clásico|Clàssic/i);
    await expect(page.getByText("Drawing Time per Round")).toBeVisible();

    // 3. Saving is what makes it stick
    await page.getByRole("button", { name: /Select Original mode/i }).click();
    await page.locator('[data-testid="confirm-options-button"]').click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    await openOptionsBtn.click();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(selectedMode).toHaveText(/^Original$/i);
    await expect(
      page.locator('[data-testid="turn-order-section"]'),
    ).toBeVisible();
  });

  test("a mode that hides the drawing options gives them back on the way out", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#player-name").fill("HostResetOpts");
    await page.locator('[data-testid="create-room-btn"]').click();
    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible(
      {
        timeout: 15000,
      },
    );

    const openOptionsBtn = page
      .locator("button:has(svg.lucide-settings)")
      .first();
    const dialog = page.getByRole("dialog");

    // Host sets up a drawing game first: 40s and unlimited ink
    await openOptionsBtn.click();
    await page
      .locator('button[role="radio"]')
      .filter({ hasText: /40/ })
      .first()
      .click();
    const inkToggle = page
      .locator(
        'button[aria-label*="ink limit"i], button[aria-label*="límite de tinta"i], button[aria-label*="limit"i]',
      )
      .first();
    await inkToggle.click();
    await page.locator('[data-testid="confirm-options-button"]').click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Then switches to a mode where nothing is drawn, and saves. The carousel
    // lives in this same modal, so the locks have to follow the staged mode.
    await openOptionsBtn.click();
    await page.getByRole("button", { name: /Select Original mode/i }).click();
    await page.locator('[data-testid="confirm-options-button"]').click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // The spoken mode has no use for them, so they are gone from the screen...
    await openOptionsBtn.click();
    await expect(page.locator('button[role="radio"]').first()).toHaveCount(1);
    await expect(inkToggle).toHaveCount(0);

    // ...but picking a drawing mode again hands them back exactly as they were:
    // the mode masks the host's settings, it doesn't eat them.
    await page.getByRole("button", { name: /Select Classic mode/i }).click();
    await expect(
      page.locator('button[role="radio"]').filter({ hasText: /40/ }).first(),
    ).toHaveAttribute("aria-checked", "true");
    await expect(inkToggle).toHaveAttribute("aria-checked", "true");
  });
});
