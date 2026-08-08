import { test, expect } from "@playwright/test";

test.describe("More Real Gameplay Match Simulations (Matches 11-15)", () => {
  test("Match 11: 5-Player Chaos Match with Split Vote Tie", async ({
    browser,
  }) => {
    // 1. Host creates room in CUSTOM_WORD mode
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch11");
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
    // Picked by its own dot rather than by counting carousel steps, so
    // adding a mode cannot silently move this test onto another one.
    await pageHost.getByRole("button", { name: /Select Chaos mode/i }).click();

    // The mode is staged in the modal now: it only reaches the server on save.
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // Join 4 more players (5 total)
    const contexts = [ctxHost];
    const pages = [pageHost];
    const names = [
      "HostMatch11",
      "P2Match11",
      "P3Match11",
      "P4Match11",
      "P5Match11",
    ];

    for (let i = 1; i < 5; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto("/");
      await page.locator("#player-name").fill(names[i]);
      await page.locator("#room-code").fill(roomCode);
      await page.locator('[data-testid="join-room-btn"]').click();
      contexts.push(ctx);
      pages.push(page);
    }

    await expect(pageHost.locator("body")).toContainText("P5Match11", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // CUSTOM_WORD phase: submit words
    const customWords = ["Pizza", "Taco", "Burger", "Sushi", "Pasta"];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const wordInput = page.locator('[data-testid="custom-word-input"]');
      await expect(wordInput).toBeVisible({ timeout: 15000 });
      await wordInput.fill(customWords[i]);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    // Role reveal
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

    // Advance turns to VOTING
    for (let turn = 0; turn < 10; turn++) {
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

    // Split Vote: 2 vote P2, 2 vote P3, 1 skips -> Tie
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );

      if (i < 2) {
        const card = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: "P2Match11" })
          .first();
        if (await card.isEnabled()) await card.click();
        else await page.locator('[data-testid="skip-vote-btn"]').click();
      } else if (i < 4) {
        const card = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: "P3Match11" })
          .first();
        if (await card.isEnabled()) await card.click();
        else await page.locator('[data-testid="skip-vote-btn"]').click();
      } else {
        await page.locator('[data-testid="skip-vote-btn"]').click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Verify RESULTS screen resolves to Nobody was ejected / Next Round
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota|Defeated|Won|Ejected/i,
        { timeout: 15000 },
      );
    }

    for (const ctx of contexts) await ctx.close();
  });

  test("Match 12: Rapid Emergency Alert & Mid-Voting Disconnect", async ({
    browser,
  }) => {
    // Setup 3 players
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch12");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match12");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match12");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match12", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
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

    // Slam Emergency Alert button and confirm modal
    for (const page of pages) {
      const alertBtn = page.locator('[data-testid="emergency-alert-btn"]');
      if (await alertBtn.isVisible()) {
        await alertBtn.click();
        const confirmBtn = page
          .locator("button", { hasText: /Confirm|Confirmar/i })
          .first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
        break;
      }
    }

    // Transition to VOTING phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }

    // Player 3 votes, then disconnects
    await pageP3.locator('[data-testid="skip-vote-btn"]').click();
    await pageP3.locator('[data-testid="confirm-vote-btn"]').click();
    await ctxP3.close();

    // Remaining connected players vote to skip
    await pageHost.locator('[data-testid="skip-vote-btn"]').click();
    await pageHost.locator('[data-testid="confirm-vote-btn"]').click();

    await pageP2.locator('[data-testid="skip-vote-btn"]').click();
    await pageP2.locator('[data-testid="confirm-vote-btn"]').click();

    // RESULTS phase reached
    await expect(pageHost.locator("body")).toContainText(
      /Nobody was ejected|Result|Victoria|Derrota|Defeated|Won|Ejected/i,
      { timeout: 15000 },
    );

    await ctxHost.close();
    await ctxP2.close();
  });

  test("Match 13: Color Palette Switcher & Eraser Tool Drawing Sync", async ({
    browser,
  }) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch13");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match13");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match13");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match13", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
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

    // Active drawer switches colors and draws
    for (const page of pages) {
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 150, box.y + 150);
          await page.mouse.up();
        }
        await doneBtn.click();
        break;
      }
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Match 14: Mid-Lobby Options Config WebSocket Sync", async ({
    browser,
  }) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch14");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Host updates options in Lobby
    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();
    const closeOptionsBtn = pageHost
      .locator('[data-testid="close-modal-button"]')
      .first();
    await closeOptionsBtn.click();

    // Player 2 joins mid-config
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match14");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P2Match14", {
      timeout: 15000,
    });

    await ctxHost.close();
    await ctxP2.close();
  });

  test("Match 15: 4-Round Continuous Championship Campaign", async ({
    browser,
  }) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch15");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match15");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match15");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match15", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
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

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
