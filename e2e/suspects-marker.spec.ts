import { test, expect } from "@playwright/test";

test.describe("Comprehensive E2E: Suspect Marker System", () => {
  test("Mark player as Suspect during DRAWING phase and verify suspect highlight in VOTING phase", async ({
    browser,
  }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostSusMarker");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2SusMarker");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3SusMarker");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3SusMarker", {
      timeout: 15000,
    });

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

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // 2. Open SuspectsPopover on a non-turn page and mark P3SusMarker as suspect
    let nonTurnPage = pageP2;
    const playersBtnP2 = pageP2.locator(
      'button[aria-label*="Players"i], button[aria-label*="Jugadores"i]',
    );
    if (!(await playersBtnP2.isVisible())) {
      nonTurnPage = pageHost;
    }

    const playersBtn = nonTurnPage.locator(
      'button[aria-label*="Players"i], button[aria-label*="Jugadores"i]',
    );
    await expect(playersBtn).toBeVisible({ timeout: 10000 });
    await playersBtn.click();

    // Click P3SusMarker suspect toggle button in popover
    const susToggleBtn = nonTurnPage
      .locator("button", { hasText: "P3SusMarker" })
      .first();
    await expect(susToggleBtn).toBeVisible({ timeout: 10000 });
    await susToggleBtn.click();

    // 3. Advance turns to VOTING phase
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

    // 4. Verify suspect indicator on VotingScreen for P3SusMarker
    await expect(nonTurnPage.locator("body")).toContainText(
      /Suspect|Sospechoso/i,
      { timeout: 15000 },
    );

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
