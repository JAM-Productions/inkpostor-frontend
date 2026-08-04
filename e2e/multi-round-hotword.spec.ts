import { test, expect } from "@playwright/test";

test.describe("Deep E2E: Multi-Round HOT_WORD Game Loop", () => {
  test("HOT_WORD Mode: Round 1 tie vote ➔ Next Round ➔ WORD_REVEAL with new word ➔ Round 2 DRAWING", async ({
    browser,
  }) => {
    // 1. Host creates room & selects HOT_WORD mode
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostHotWord");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Select HOT_WORD mode (click next mode twice in options)
    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();

    const nextModeBtn = pageHost
      .locator('button[aria-label*="Next"i], button[aria-label*="Siguiente"i]')
      .first();
    await nextModeBtn.click();
    await nextModeBtn.click();

    const closeOptionsBtn = pageHost
      .locator('[data-testid="close-modal-button"]')
      .first();
    await closeOptionsBtn.click();

    // 2. Players 2 and 3 join
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2HotWord");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3HotWord");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3HotWord", {
      timeout: 15000,
    });

    // 3. Start game & reveal roles
    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // 4. Drawing phase ➔ Advance turns to VOTING
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    for (let turn = 0; turn < 6; turn++) {
      for (const page of pages) {
        const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
        if (await doneBtn.isVisible()) {
          await doneBtn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      if (
        await pageHost
          .locator("body")
          .filter({ hasText: /Voting Time|Tiempo de votación/i })
          .isVisible()
      ) {
        break;
      }
    }

    // 5. Voting phase: All 3 players skip vote ➔ Nobody ejected
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 15000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // 6. Results phase: Verify "Nobody was ejected"
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Nadie ha sido expulsado|Result/i,
        { timeout: 15000 },
      );
    }

    // 7. All connected players click "Next Round"
    for (const page of pages) {
      const nextRoundBtn = page.locator('[data-testid="next-round-btn"]');
      await expect(nextRoundBtn).toBeVisible({ timeout: 15000 });
      await nextRoundBtn.click();
    }

    // 8. HOT_WORD transitions to WORD_REVEAL phase for Round 2!
    for (const page of pages) {
      const wordCard = page.locator('[data-testid="reveal-word-card"]');
      await expect(wordCard).toBeVisible({ timeout: 15000 });
      await wordCard.click();

      const confirmWordBtn = page.locator('[data-testid="confirm-word-btn"]');
      await expect(confirmWordBtn).toBeVisible({ timeout: 15000 });
      await confirmWordBtn.click();
    }

    // Round 2 Drawing phase starts
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
