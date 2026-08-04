import { test, expect } from "@playwright/test";

test.describe("Canvas & Mid-Game Features E2E Suite", () => {
  test("Emergency Alert Button triggers instant transition to VOTING phase across all clients", async ({
    browser,
  }) => {
    // 3 Players start game and reach DRAWING phase
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostEmergency");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Emergency");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Emergency");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    // Start Game & reveal roles
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

    // After ALL players confirm, canvas appears for all players
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Find a page where it's NOT the player's turn (Emergency Alert is rendered for non-drawing players)
    let nonTurnPage = pageP2;
    const alertBtnP2 = pageP2.locator('[data-testid="emergency-alert-btn"]');
    if (!(await alertBtnP2.isVisible())) {
      nonTurnPage = pageHost;
    }

    const alertBtn = nonTurnPage.locator('[data-testid="emergency-alert-btn"]');
    await expect(alertBtn).toBeVisible({ timeout: 15000 });
    await alertBtn.click();

    const confirmAlertBtn = nonTurnPage.locator(
      '[data-testid="confirm-emergency-btn"]',
    );
    await expect(confirmAlertBtn).toBeVisible({ timeout: 15000 });
    await confirmAlertBtn.click();

    // Assert ALL 3 players transition to VOTING phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación|Who is the Inkpostor/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Vote-Kick Feature: 2 players vote to kick 3rd player during DRAWING phase", async ({
    browser,
  }) => {
    // 3 Players start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostKick");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Kick");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("TargetKickP3");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    // Start Game & reveal roles
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

    // After ALL players confirm, canvas appears for all players
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Helper to vote to kick TargetKickP3 from a non-turn page
    const voteToKickTarget = async (page: typeof pageHost) => {
      // If it's this player's turn, end turn first so SuspectsPopover becomes available
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        await doneBtn.click();
      }

      const playersPopoverBtn = page.locator(
        'button[aria-label*="Players"i], button[aria-label*="Jugadores"i]',
      );
      await expect(playersPopoverBtn).toBeVisible({ timeout: 10000 });
      await playersPopoverBtn.click();

      const vkBtn = page.locator('button[aria-label*="TargetKickP3"i]').first();
      await expect(vkBtn).toBeVisible({ timeout: 10000 });
      await vkBtn.click();
      await page.locator('[data-testid="confirm-kick-button"]').click();
    };

    // Host votes to kick TargetKickP3
    await voteToKickTarget(pageHost);

    // Player 2 votes to kick TargetKickP3 (reaching 2/2 required votes threshold)
    await voteToKickTarget(pageP2);

    // Assert TargetKickP3 is kicked and removed/disconnected from room (returned to join screen)
    await expect(pageP3.locator("#player-name")).toBeVisible({
      timeout: 15000,
    });

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
