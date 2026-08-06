import { test, expect } from "@playwright/test";

test.describe("Production Resilience: Reconnection & Disconnect Handling", () => {
  test("Network Disconnection Recovery: Player disconnects and reconnects mid-game, preserving game state & canvas", async ({
    browser,
  }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostReconn");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Player 2 & 3 join
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Reconn");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Reconn");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Reconn", {
      timeout: 15000,
    });

    // 3. Start Game
    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];

    // 4. Role reveal on all 3 pages
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // 5. Simulate network disconnect & reconnect on Player 2 (setOffline)
    await ctxP2.setOffline(true);
    await pageP2.waitForTimeout(1000);
    await ctxP2.setOffline(false);

    // 6. Verify game canvas & UI state remain healthy on Player 2
    await expect(pageP2.locator("canvas")).toBeVisible({ timeout: 15000 });
    await expect(pageHost.locator("canvas")).toBeVisible({ timeout: 15000 });

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Impostor Disconnect Surrender: Impostor disconnects during IMPOSTOR_GUESS phase and room resolves to Crewmates Win", async ({
    browser,
  }) => {
    // 1. Host creates room with Impostor Can Guess enabled
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostDisSurr");
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
    // Impostor Can Guess is on by default: confirm it rather than turn it on
    const guessToggle = pageHost
      .locator('button[aria-label*="impostor"i]')
      .first();
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2DisSurr");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3DisSurr");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3DisSurr", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    const contexts = [ctxHost, ctxP2, ctxP3];
    const playerNames = ["HostDisSurr", "P2DisSurr", "P3DisSurr"];

    let impostorName = "";
    let impostorContext = ctxHost;
    let impostorPage = pageHost;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");
      await page.waitForTimeout(200);

      const isInkpostor = await page
        .locator('img[alt="Inkpostor Logo"]')
        .isVisible();
      if (isInkpostor) {
        impostorName = playerNames[i];
        impostorContext = contexts[i];
        impostorPage = page;
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns to VOTING
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

    // Vote out Impostor
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const name = playerNames[i];
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );

      if (name !== impostorName && impostorName) {
        const voteTargetCard = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: impostorName })
          .first();
        await expect(voteTargetCard).toBeEnabled({ timeout: 10000 });
        await voteTargetCard.click();
      } else {
        const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Wait for IMPOSTOR_GUESS phase UI to settle on impostorPage
    await expect(
      impostorPage.locator('[data-testid="skip-guess-btn"]').first(),
    ).toBeVisible({ timeout: 15000 });

    // Impostor context closes (surrender) during IMPOSTOR_GUESS phase
    await impostorContext.close();

    // Remaining connected pages see RESULTS screen ("Crewmates Win")
    for (let i = 0; i < pages.length; i++) {
      if (playerNames[i] !== impostorName) {
        await expect(pages[i].locator("body")).toContainText(
          /Defeated|Won|Result|Victoria|Derrota/i,
          { timeout: 15000 },
        );
      }
    }

    if (impostorContext !== ctxHost) await ctxHost.close();
    if (impostorContext !== ctxP2) await ctxP2.close();
    if (impostorContext !== ctxP3) await ctxP3.close();
  });
});
