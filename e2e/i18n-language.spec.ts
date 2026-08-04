import { test, expect } from "@playwright/test";

test.describe("Comprehensive E2E: Dynamic Language Switching (i18n)", () => {
  test("Language Switcher toggles language between English and Spanish dynamically across UI", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Open LanguageSwitcher
    const langBtn = page.locator('[data-testid="language-switcher-btn"]');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    // 2. Select Spanish
    const esOption = page.locator('[data-testid="lang-option-es"]');
    await expect(esOption).toBeVisible({ timeout: 5000 });
    await esOption.click();

    // Verify UI text translates to Spanish
    await expect(page.locator('[data-testid="create-room-btn"]')).toContainText(
      /Crear Nueva Partida/i,
      { timeout: 5000 },
    );
    await expect(page.locator('[data-testid="join-room-btn"]')).toContainText(
      /Unirse/i,
      { timeout: 5000 },
    );

    // 3. Switch back to English
    await langBtn.click();
    const enOption = page.locator('[data-testid="lang-option-en"]');
    await expect(enOption).toBeVisible({ timeout: 5000 });
    await enOption.click();

    // Verify UI text translates back to English
    await expect(page.locator('[data-testid="create-room-btn"]')).toContainText(
      /Create New Game/i,
      { timeout: 5000 },
    );
    await expect(page.locator('[data-testid="join-room-btn"]')).toContainText(
      /Join Game/i,
      { timeout: 5000 },
    );
  });
});
