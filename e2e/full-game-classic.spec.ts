import { test, expect } from "@playwright/test";

test.describe("Deep E2E: Full CLASSIC Game Loop & Play Again", () => {
  test("Executes complete game: Lobby ➔ Role Reveal ➔ Drawing Turns ➔ Voting ➔ Ejection Results ➔ Play Again", async ({
    browser,
  }) => {
    // 1. Setup 3 Players
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostFullGame");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("PlayerTwoFull");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("PlayerThreeFull");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    // Ensure Host sees all 3 players in lobby
    await expect(pageHost.locator("body")).toContainText("PlayerThreeFull", {
      timeout: 15000,
    });

    // 2. Start Game
    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 3. Role Reveal phase for all players
    const pages = [pageHost, pageP2, pageP3];
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // 4. Drawing phase: each active drawer finishes their turn by clicking "Done"
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns until VOTING phase is reached
    for (let turn = 0; turn < 6; turn++) {
      // Find the page whose turn it currently is
      for (const page of pages) {
        const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
        if (await doneBtn.isVisible()) {
          await doneBtn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      // Stop if room has transitioned to VOTING phase
      if (
        await pageHost
          .locator("body")
          .filter({ hasText: /Voting Time|Tiempo de votación/i })
          .isVisible()
      ) {
        break;
      }
    }

    // 5. Voting phase: players cast votes for PlayerThreeFull
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }

    // Host and PlayerTwo vote for PlayerThreeFull
    for (const page of [pageHost, pageP2]) {
      const voteTargetCard = page
        .locator('button[data-testid*="vote-card-"]')
        .filter({ hasText: "PlayerThreeFull" })
        .first();
      await expect(voteTargetCard).toBeVisible({ timeout: 15000 });
      await voteTargetCard.click();

      const confirmVoteBtn = page.locator('[data-testid="confirm-vote-btn"]');
      await expect(confirmVoteBtn).toBeEnabled();
      await confirmVoteBtn.click();
    }

    // PlayerThreeFull votes skip
    const skipBtn = pageP3.locator('[data-testid="skip-vote-btn"]');
    await expect(skipBtn).toBeVisible({ timeout: 15000 });
    await skipBtn.click();
    await pageP3.locator('[data-testid="confirm-vote-btn"]').click();

    // If Impostor Final Guess phase triggered, skip the guess
    const skipGuessBtn = pageP3.locator('[data-testid="skip-guess-btn"]');
    if (await skipGuessBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipGuessBtn.click();
    }

    // 6. Results phase: room resolves voting outcome
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Defeated|Won|Result|Victoria|Derrota|eliminated|elimina/i,
        { timeout: 15000 },
      );
    }

    // 7. Host clicks "Play Again" to restart game session
    const playAgainBtn = pageHost.locator('[data-testid="play-again-btn"]');
    await expect(playAgainBtn).toBeVisible({ timeout: 15000 });
    await playAgainBtn.click();

    for (const page of pages) {
      await expect(
        page.locator('[data-testid="room-code-display"]'),
      ).toBeVisible({ timeout: 15000 });
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
