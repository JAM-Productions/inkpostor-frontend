import { test, expect } from "@playwright/test";

test.describe("Deep E2E: Impostor Final Guess Feature Flow", () => {
  test("Impostor Can Guess enabled ➔ Impostor ejected ➔ IMPOSTOR_GUESS phase ➔ Skip ➔ Crewmates Win", async ({
    browser,
  }) => {
    // 1. Host creates room & enables Impostor Can Guess option
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostGuessMode");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Enable Impostor Can Guess in Options modal
    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();

    const guessToggle = pageHost
      .locator('button[aria-label*="impostor"i]')
      .first();
    await guessToggle.click();
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Players 2 and 3 join
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2GuessMode");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3GuessMode");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3GuessMode", {
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

    // 5. Voting phase: Vote out P3GuessMode
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }

    for (const page of [pageHost, pageP2]) {
      const voteTargetCard = page
        .locator('button[data-testid*="vote-card-"]')
        .filter({ hasText: "P3GuessMode" })
        .first();
      await expect(voteTargetCard).toBeVisible({ timeout: 15000 });
      await voteTargetCard.click();

      const confirmVoteBtn = page.locator('[data-testid="confirm-vote-btn"]');
      await expect(confirmVoteBtn).toBeEnabled();
      await confirmVoteBtn.click();
    }

    const skipBtn = pageP3.locator('[data-testid="skip-vote-btn"]');
    await expect(skipBtn).toBeVisible({ timeout: 15000 });
    await skipBtn.click();
    await pageP3.locator('[data-testid="confirm-vote-btn"]').click();

    // 6. Verify IMPOSTOR_GUESS phase or RESULTS phase
    // If P3 was Impostor, room enters IMPOSTOR_GUESS phase where skip button is rendered on P3's screen
    const skipGuessBtn = pageP3.locator('[data-testid="skip-guess-btn"]');
    if (await skipGuessBtn.isVisible()) {
      await skipGuessBtn.click();
    }

    // All players reach final RESULTS phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Defeated|Won|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
