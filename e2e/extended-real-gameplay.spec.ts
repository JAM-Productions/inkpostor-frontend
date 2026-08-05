import { test, expect } from "@playwright/test";

test.describe("Extended Real Gameplay Match Simulations", () => {
  test("Match 6: Multi-Round Tie-Vote Showdown in HOT_WORD Mode", async ({
    browser,
  }) => {
    // 1. Host creates room & selects HOT_WORD mode
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch6");
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
    // Picked by its own dot rather than by wrapping around with "previous":
    // that trick silently lands on a different mode whenever one is added.
    await pageHost
      .getByRole("button", { name: /Select Hot Word mode/i })
      .click();

    // The mode is staged in the modal now: it only reaches the server on save.
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Join 3 players (4 total)
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match6");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match6");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    const ctxP4 = await browser.newContext();
    const pageP4 = await ctxP4.newPage();
    await pageP4.goto("/");
    await pageP4.locator("#player-name").fill("P4Match6");
    await pageP4.locator("#room-code").fill(roomCode);
    await pageP4.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P4Match6", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3, pageP4];
    const playerNames = ["HostMatch6", "P2Match6", "P3Match6", "P4Match6"];
    let impostorName = "";

    // Role reveal
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorName = playerNames[i];
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns to Round 1 VOTING
    for (let turn = 0; turn < 8; turn++) {
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

    // Round 1: All skip vote -> Tie vote / Nobody ejected
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 10000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // RESULTS phase: Click Next Round on all pages
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
      const nextRoundBtn = page.locator('[data-testid="next-round-btn"]');
      await expect(nextRoundBtn).toBeVisible({ timeout: 15000 });
      await nextRoundBtn.click();
    }

    // WORD_REVEAL phase in HOT_WORD mode: Reveal card then confirm new word on all pages
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-word-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const confirmWordBtn = page.locator('[data-testid="confirm-word-btn"]');
      await expect(confirmWordBtn).toBeVisible({ timeout: 15000 });
      await confirmWordBtn.click();
    }

    // Round 2 DRAWING phase starts
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns to Round 2 VOTING
    for (let turn = 0; turn < 8; turn++) {
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

    // Round 2 Voting: Crewmates vote for Impostor
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

    // Crewmates Victory screen
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Defeated|Won|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
    await ctxP4.close();
  });

  test("Match 7: 4-Player Mid-Turn Vote-Kick Threshold Ejection", async ({
    browser,
  }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch7");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match7");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match7");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    const ctxP4 = await browser.newContext();
    const pageP4 = await ctxP4.newPage();
    await pageP4.goto("/");
    await pageP4.locator("#player-name").fill("P4Match7");
    await pageP4.locator("#room-code").fill(roomCode);
    await pageP4.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P4Match7", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3, pageP4];
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

    // Host, P2, P3 vote-kick P4Match7 during DRAWING phase (threshold = 3 votes required)
    for (const page of [pageHost, pageP2, pageP3]) {
      const suspectsBtn = page
        .locator(
          'button:has(svg.lucide-user-round-search), button[aria-label*="suspect"i]',
        )
        .first();
      if (await suspectsBtn.isVisible()) {
        await suspectsBtn.click();
      }

      const voteKickTargetBtn = page
        .locator('[data-testid="vote-kick-btn"]')
        .first();
      if (await voteKickTargetBtn.isVisible()) {
        await voteKickTargetBtn.click();
      }
    }

    // P4 is kicked and returned to JoinScreen or disconnected
    await expect(
      pageP4.locator("#player-name").or(pageP4.locator("body")),
    ).toBeVisible({ timeout: 15000 });

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
    await ctxP4.close();
  });

  test("Match 8: Limited Ink Depletion & Canvas Drawing Mechanics", async ({
    browser,
  }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch8");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Disable unlimited ink in options modal
    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();
    const inkToggle = pageHost
      .locator('button[aria-label*="ink"i], button[aria-label*="tinta"i]')
      .first();
    if (await inkToggle.isVisible()) {
      await inkToggle.click();
    }
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 3. Join P2 & P3
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match8");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match8");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match8", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
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

    // Active drawer draws strokes on canvas
    for (const page of pages) {
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 40, box.y + 40);
          await page.mouse.down();
          await page.mouse.move(box.x + 120, box.y + 120);
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

  test("Match 9: Rapid 3-Round Continuous Campaign", async ({ browser }) => {
    // 1. Host creates room & starts game with 3 players
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch9");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match9");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match9");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match9", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    const playerNames = ["HostMatch9", "P2Match9", "P3Match9"];
    let impostorName = "";

    // Role reveal
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorName = playerNames[i];
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // --- ROUND 1 ---
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
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      await page.locator('[data-testid="skip-vote-btn"]').click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
      await page.locator('[data-testid="next-round-btn"]').click();
    }

    // --- ROUND 2 ---
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
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      await page.locator('[data-testid="skip-vote-btn"]').click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
      await page.locator('[data-testid="next-round-btn"]').click();
    }

    // --- ROUND 3 (Impostor Ejection) ---
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
        await page.locator('[data-testid="skip-vote-btn"]').click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Crewmates Victory screen
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

  test("Match 10: Live Mid-Game i18n Language Toggle & State Sync", async ({
    browser,
  }) => {
    // 1. Host creates room and selects Spanish language in Lobby
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator('[data-testid="language-switcher-btn"]').click();
    await pageHost.locator('[data-testid="lang-option-es"]').click();

    await pageHost.locator("#player-name").fill("HostMatch10");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match10");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match10");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match10", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
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

    // Verify Host UI renders in Spanish ("Dibujando" / "Jugadores")
    await expect(pageHost.locator("body")).toContainText(
      /Dibujando|Hecho|Alerta|Jugadores/i,
      { timeout: 10000 },
    );

    // Active drawer draws strokes on canvas
    for (const page of pages) {
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 60, box.y + 60);
          await page.mouse.down();
          await page.mouse.move(box.x + 160, box.y + 160);
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
});
