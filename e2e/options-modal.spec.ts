import { test, expect } from "@playwright/test";

test.describe("Options Modal E2E Suite", () => {
  test("Host can configure and save all game options and verify mode lock rules", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Host enters name and creates room
    const nameInput = page.locator("#player-name");
    await expect(nameInput).toBeEnabled({ timeout: 15000 });
    await nameInput.fill("HostOptUser");

    const createBtn = page.locator('[data-testid="create-room-btn"]');
    await createBtn.click();

    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible(
      { timeout: 15000 },
    );

    // 2. Open Options modal
    const openOptionsBtn = page
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();

    const optionsDialog = page.getByRole("dialog");
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });

    // 3. Configure options (Drawing time: 40s)
    const time40Btn = page
      .locator('button[role="radio"]')
      .filter({ hasText: /40/ })
      .first();
    await time40Btn.click();
    await expect(time40Btn).toHaveAttribute("aria-checked", "true");

    // Toggle Unlimited Ink
    const inkToggle = page
      .locator('button[aria-label*="ink"i], button[aria-label*="tinta"i]')
      .first();
    await inkToggle.click();
    await expect(inkToggle).toHaveAttribute("aria-checked", "true");

    // Toggle Impostor Can Guess
    const guessToggle = page.locator('button[aria-label*="impostor"i]').first();
    await guessToggle.click();
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");

    // Decrease attempts (from default 3 to 2)
    const decreaseAttemptsBtn = page
      .locator(
        'button[aria-label*="decrease"i], button[aria-label*="disminuir"i]',
      )
      .first();
    await expect(decreaseAttemptsBtn).toBeEnabled();
    await decreaseAttemptsBtn.click();

    // Increase attempts (from 2 back to 3)
    const increaseAttemptsBtn = page
      .locator(
        'button[aria-label*="increase"i], button[aria-label*="aumentar"i]',
      )
      .first();
    await expect(increaseAttemptsBtn).toBeEnabled();
    await increaseAttemptsBtn.click();

    // Confirm & save options
    const confirmBtn = page.locator('[data-testid="confirm-options-button"]');
    await confirmBtn.click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });

    // Re-open to confirm settings persisted
    await openOptionsBtn.click();
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });
    await expect(time40Btn).toHaveAttribute("aria-checked", "true");
    await expect(inkToggle).toHaveAttribute("aria-checked", "true");
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");

    // 4. Switch Game Mode to Chaos (CUSTOM_WORD) and verify Impostor Guess becomes locked
    const nextModeBtn = page
      .locator('button[aria-label*="Next"i], button[aria-label*="Siguiente"i]')
      .first();
    await nextModeBtn.click();

    // Check locked indicator appears
    const lockedNotice = page.locator(
      '[data-testid="impostor-guess-unavailable"]',
    );
    await expect(lockedNotice).toBeVisible();

    // Close modal
    const closeBtn = page.locator('[data-testid="close-modal-button"]').first();
    await closeBtn.click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });
  });
});
