import { test, expect, Page } from "@playwright/test";

test.describe("Multi-Impostor Feature Full Game E2E Suite", () => {
  test("Complete multi-impostor game: Lobby options setup ➔ Teammate role reveal ➔ Round 1 ejection (1 remaining) ➔ Round 2 final ejection & victory", async ({
    browser,
  }) => {
    // 1. Setup 5 Players (Host + P2..P5)
    const hostCtx = await browser.newContext();
    const p2Ctx = await browser.newContext();
    const p3Ctx = await browser.newContext();
    const p4Ctx = await browser.newContext();
    const p5Ctx = await browser.newContext();

    const hostPage = await hostCtx.newPage();
    const p2Page = await p2Ctx.newPage();
    const p3Page = await p3Ctx.newPage();
    const p4Page = await p4Ctx.newPage();
    const p5Page = await p5Ctx.newPage();

    const pages = [
      { name: "Player1", page: hostPage },
      { name: "Player2", page: p2Page },
      { name: "Player3", page: p3Page },
      { name: "Player4", page: p4Page },
      { name: "Player5", page: p5Page },
    ];

    // Host creates room
    await hostPage.goto("/");
    await hostPage.locator("#player-name").fill("Player1");
    await expect(
      hostPage.locator('[data-testid="create-room-btn"]'),
    ).toBeEnabled({ timeout: 15000 });
    await hostPage.locator('[data-testid="create-room-btn"]').click();
    await expect(
      hostPage.locator('[data-testid="room-code-display"]'),
    ).toBeVisible({ timeout: 15000 });
    const roomCode = (
      await hostPage.locator('[data-testid="room-code-display"]').innerText()
    ).trim();

    // Players 2..5 join room
    for (let i = 1; i < pages.length; i++) {
      const { name, page } = pages[i];
      await page.goto("/");
      await page.locator("#player-name").fill(name);
      await page.locator("#room-code").fill(roomCode);
      const joinBtn = page.locator('[data-testid="join-room-btn"]');
      await expect(joinBtn).toBeEnabled({ timeout: 15000 });
      await joinBtn.click();
      await expect(
        page.locator('[data-testid="room-code-display"]'),
      ).toBeVisible({ timeout: 15000 });
    }

    // Host verifies all 5 players in lobby
    await expect(hostPage.locator("body")).toContainText("Player5", {
      timeout: 15000,
    });

    // 2. Host opens options modal & sets Inkpostors count to 2
    const openOptionsBtn = hostPage
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();
    await expect(hostPage.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    const increaseBtn = hostPage.locator(
      '[data-testid="increase-impostors-btn"]',
    );
    await expect(increaseBtn).toBeEnabled({ timeout: 10000 });
    await increaseBtn.click();
    await expect(
      hostPage.locator('[data-testid="impostor-count-value"]'),
    ).toHaveText("2");

    // Verify teammate reveal sub-option is present
    await expect(
      hostPage.locator('[data-testid="reveal-teammates-suboption"]'),
    ).toBeVisible();

    // Confirm options
    await hostPage.locator('[data-testid="confirm-options-button"]').click();
    await expect(hostPage.getByRole("dialog")).toBeHidden();

    // 3. Start Game
    const startBtn = hostPage.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 4. Role Reveal phase
    const impostors: { name: string; page: Page }[] = [];
    const crewmates: { name: string; page: Page }[] = [];

    for (const item of pages) {
      const card = item.page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");

      const isImp = await item.page.evaluate(
        () => (window as any).__GAME_STORE__.getState().amIImpostor,
      );
      if (isImp) {
        impostors.push(item);
      } else {
        crewmates.push(item);
      }
    }

    expect(impostors.length).toBe(2);
    expect(crewmates.length).toBe(3);

    // Verify that the 2 Inkpostors see their fellow Inkpostor's name
    const imp1 = impostors[0];
    const imp2 = impostors[1];

    await imp1.page
      .locator('[data-testid="reveal-role-card"]')
      .dispatchEvent("mousedown");
    await expect(
      imp1.page.locator('[data-testid="impostor-teammates"]'),
    ).toContainText(imp2.name);

    await imp2.page
      .locator('[data-testid="reveal-role-card"]')
      .dispatchEvent("mousedown");
    await expect(
      imp2.page.locator('[data-testid="impostor-teammates"]'),
    ).toContainText(imp1.name);

    // All players proceed to drawing
    for (const item of pages) {
      const proceedBtn = item.page.locator(
        '[data-testid="proceed-to-drawing-btn"]',
      );
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // Helper to finish turns during drawing phase
    const finishDrawingPhase = async () => {
      for (let turn = 0; turn < 10; turn++) {
        for (const item of pages) {
          const doneBtn = item.page.locator(
            'button:has-text("Done"), button:has-text("Hecho")',
          );
          if (await doneBtn.isVisible()) {
            await doneBtn.click();
            await item.page.waitForTimeout(300);
            break;
          }
        }
        if (
          await hostPage
            .locator("body")
            .filter({ hasText: /Voting Time|Tiempo de votación/i })
            .isVisible()
        ) {
          break;
        }
      }
    };

    // 5. Round 1 Drawing & Voting
    await finishDrawingPhase();

    // Verify Voting phase for all
    for (const item of pages) {
      await expect(item.page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }

    // Eject Impostor 1: Everyone votes for imp1, imp1 votes skip
    for (const item of pages) {
      if (item.name === imp1.name) {
        const skipBtn = item.page.locator('[data-testid="skip-vote-btn"]');
        await expect(skipBtn).toBeVisible({ timeout: 15000 });
        await skipBtn.click();
      } else {
        const voteTargetCard = item.page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: imp1.name })
          .first();
        await expect(voteTargetCard).toBeVisible({ timeout: 15000 });
        await voteTargetCard.click();
      }
      const confirmVoteBtn = item.page.locator(
        '[data-testid="confirm-vote-btn"]',
      );
      await expect(confirmVoteBtn).toBeEnabled({ timeout: 10000 });
      await confirmVoteBtn.click();
    }

    // 6. Round 1 Results: Ejected 1st Inkpostor, 1 Inkpostor remains
    //
    // Ejecting an impostor opens their final guess before the results, so this
    // screen may or may not appear. `isVisible()` never waits — handing it a
    // timeout does not change that — so give the screen a real chance to arrive
    // before concluding it is not coming. Missing the guess parks the game in
    // IMPOSTOR_GUESS and every assertion after this point fails.
    const skipGuessBtn1 = imp1.page.locator('[data-testid="skip-guess-btn"]');
    await skipGuessBtn1
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    if (await skipGuessBtn1.isVisible()) {
      await skipGuessBtn1.click();
    }

    for (const item of pages) {
      await expect(
        item.page.locator('[data-testid="impostor-ejected-remaining"]'),
      ).toBeVisible({ timeout: 15000 });
      await expect(
        item.page.locator('[data-testid="impostor-ejected-remaining"]'),
      ).toContainText("1");
    }

    // Verify game is NOT over yet (play-again-btn not visible, next-round-btn visible)
    await expect(
      hostPage.locator('[data-testid="play-again-btn"]'),
    ).not.toBeVisible();

    // 7. Proceed to Round 2
    const activePages = [hostPage, p2Page, p3Page, p4Page, p5Page];
    for (const p of activePages) {
      const nextRoundBtn = p
        .locator(
          'button:has-text("Next Round"), button:has-text("Siguiente Ronda"), button:has-text("Següent Ronda")',
        )
        .first();
      if (await nextRoundBtn.isVisible()) {
        await nextRoundBtn.click();
      }
    }

    // 8. Round 2 Drawing & Voting
    await finishDrawingPhase();

    // Eject Impostor 2: Everyone votes for imp2, imp2 votes skip
    for (const item of pages) {
      if (
        await item.page.locator('[data-testid="confirm-vote-btn"]').isVisible()
      ) {
        if (item.name === imp2.name) {
          const skipBtn = item.page.locator('[data-testid="skip-vote-btn"]');
          if (await skipBtn.isVisible()) {
            await skipBtn.click();
          }
        } else {
          const voteTargetCard = item.page
            .locator('button[data-testid*="vote-card-"]')
            .filter({ hasText: imp2.name })
            .first();
          if (await voteTargetCard.isVisible()) {
            await voteTargetCard.click();
          }
        }
        const confirmVoteBtn = item.page.locator(
          '[data-testid="confirm-vote-btn"]',
        );
        if (await confirmVoteBtn.isEnabled()) {
          await confirmVoteBtn.click();
        }
      }
    }

    // 9. Round 2 Results: All Inkpostors Defeated, Game Ends!
    const skipGuessBtn2 = imp2.page.locator('[data-testid="skip-guess-btn"]');
    await skipGuessBtn2
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    if (await skipGuessBtn2.isVisible()) {
      await skipGuessBtn2.click();
    }

    for (const item of pages) {
      await expect(item.page.locator("body")).toContainText(
        /Defeated|Won|Victoria|Derrota|eliminated|elimina/i,
        { timeout: 15000 },
      );
    }

    await expect(
      hostPage.locator('[data-testid="play-again-btn"]'),
    ).toBeVisible({ timeout: 15000 });

    // Clean up browser contexts
    await Promise.all([
      hostCtx.close(),
      p2Ctx.close(),
      p3Ctx.close(),
      p4Ctx.close(),
      p5Ctx.close(),
    ]);
  });
});
