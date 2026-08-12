import { test, expect } from "@playwright/test";

test.describe("Prevent Repeat Inkpostors E2E Suite", () => {
  test("Host creates room and option defaults to true; options modal toggles correctly", async ({
    page,
  }) => {
    await page.goto("/");

    // Enter name & create room
    const nameInput = page.locator("#player-name");
    await expect(nameInput).toBeEnabled({ timeout: 15000 });
    await nameInput.fill("HostUser");

    const createBtn = page.locator('[data-testid="create-room-btn"]');
    await createBtn.click();

    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible(
      { timeout: 15000 },
    );

    // Open options modal
    const openOptionsBtn = page
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();

    const optionsDialog = page.getByRole("dialog");
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });

    // Verify Prevent Repeat toggle exists and is checked by default
    const preventRepeatToggle = optionsDialog.locator(
      '[data-testid="prevent-repeat-suboption"] button[role="switch"]',
    );
    await expect(preventRepeatToggle).toBeVisible();
    await expect(preventRepeatToggle).toHaveAttribute("aria-checked", "true");

    // Toggle off
    await preventRepeatToggle.click();
    await expect(preventRepeatToggle).toHaveAttribute("aria-checked", "false");

    // Confirm & save
    const confirmBtn = page.locator('[data-testid="confirm-options-button"]');
    await confirmBtn.click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });

    // Re-open to confirm setting persisted
    await openOptionsBtn.click();
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });
    await expect(preventRepeatToggle).toHaveAttribute("aria-checked", "false");
  });
});
