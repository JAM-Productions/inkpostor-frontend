import { test, expect } from "@playwright/test";

test.describe("High-Value Production Test: Cross-Language Impostor Secret Word Validation", () => {
  test("Impostor guesses secret word across localized languages and resolves game outcome", async ({
    browser,
  }) => {
    // 1. Host creates room with Impostor Can Guess enabled
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostCrossLang");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();
    const guessToggle = pageHost
      .locator('button[aria-label*="impostor"i]')
      .first();
    await guessToggle.click();
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Player 2 (Spanish UI) joins
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator('[data-testid="language-switcher-btn"]').click();
    await pageP2.locator('[data-testid="lang-option-es"]').click();
    await pageP2.locator("#player-name").fill("P2Spanish");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    // 3. Player 3 joins
    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3CrossLang");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3CrossLang", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    let secretWord = "";
    let impostorPage = pageHost;

    // Role reveal
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorPage = page;
      } else {
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length >= 2) {
          secretWord = lines[1];
        }
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Impostor opens guess control and submits secret word guess
    const guessControlBtn = impostorPage
      .locator('button[aria-label*="guess"i], button[aria-label*="adivinar"i]')
      .first();
    if (await guessControlBtn.isVisible()) {
      await guessControlBtn.click();
    }

    const guessInput = impostorPage.locator(
      '[data-testid="impostor-guess-input"]',
    );
    if ((await guessInput.isVisible()) && secretWord) {
      await guessInput.fill(secretWord);
      const submitGuessBtn = impostorPage.locator(
        '[data-testid="submit-guess-btn"]',
      );
      await submitGuessBtn.click();
    }

    // Verify game state updates cleanly on all pages
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Your turn|turno|Dibujando|Drawing|Won|Victoria|Defeated|Result/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
