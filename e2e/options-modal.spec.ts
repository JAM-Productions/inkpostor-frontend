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
    const inkToggle = optionsDialog
      .locator(
        'button[aria-label*="ink limit"i], button[aria-label*="límite de tinta"i], button[aria-label*="limit"i]',
      )
      .first();
    await inkToggle.click();
    await expect(inkToggle).toHaveAttribute("aria-checked", "true");

    // Impostor Can Guess is on by default, so its stepper is already there
    const guessToggle = page.locator('button[aria-label*="impostor"i]').first();
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");

    // Already at the minimum, so there is nothing left to take away
    const decreaseAttemptsBtn = page.locator(
      '[data-testid="decrease-guesses-btn"]',
    );
    await expect(decreaseAttemptsBtn).toBeDisabled();

    // Increase attempts (from the default 1 to 2)
    const increaseAttemptsBtn = page.locator(
      '[data-testid="increase-guesses-btn"]',
    );
    await expect(increaseAttemptsBtn).toBeEnabled();
    await increaseAttemptsBtn.click();
    await expect(decreaseAttemptsBtn).toBeEnabled();

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
    // Spelled out so a reordered carousel fails here, on the mode, instead of
    // further down on a lock that belongs to a different one.
    await expect(page.locator('[aria-live="polite"] p')).toHaveText(
      /Chaos|Caos/i,
    );

    // Check locked indicator appears
    const lockedNotice = page.locator(
      '[data-testid="impostor-guess-unavailable"]',
    );
    await expect(lockedNotice).toBeVisible();

    // Close modal
    const closeBtn = page.locator('[data-testid="close-modal-button"]').first();
    await closeBtn.click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });

    // 5. Reset puts the whole room back to how it starts, mode included, and
    // closes on its own
    await openOptionsBtn.click();
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="reset-options-button"]').click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });

    await openOptionsBtn.click();
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[aria-live="polite"] p')).toHaveText(
      /Classic|Clásico|Clàssic/i,
    );
    await expect(
      page.locator('button[role="radio"]').filter({ hasText: /20/ }).first(),
    ).toHaveAttribute("aria-checked", "true");
    await expect(inkToggle).toHaveAttribute("aria-checked", "false");
    // The guess is on by default, so reset brings it back rather than clearing it
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");
    await expect(
      page
        .locator(
          'button[aria-label*="decrease"i], button[aria-label*="disminuir"i]',
        )
        .first(),
    ).toBeDisabled();
  });
});
