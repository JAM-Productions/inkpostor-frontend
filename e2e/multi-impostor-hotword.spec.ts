import { test, expect } from "@playwright/test";

test.describe("Multi-Impostor HOT_WORD Mode E2E Suite", () => {
  test("5-player HOT_WORD mode with 2 Inkpostors: Round 1 ejection ➔ Word Reveal ➔ Round 2 ejection & victory", async ({
    browser,
  }) => {
    // 1. Setup 5 Players
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

    // Players 2..5 join
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

    // 2. Options: Select HOT_WORD mode and set 2 Inkpostors
    const openOptionsBtn = hostPage
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();
    await expect(hostPage.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Select HOT_WORD mode in carousel
    const hotWordBtn = hostPage
      .locator(
        'button:has-text("HOT WORD"), button:has-text("PALABRA CALIENTE")',
      )
      .first();
    if (await hotWordBtn.isVisible()) {
      await hotWordBtn.click();
    }

    // Increase Inkpostors count to 2
    const increaseBtn = hostPage.locator(
      '[data-testid="increase-impostors-btn"]',
    );
    await expect(increaseBtn).toBeEnabled({ timeout: 10000 });
    await increaseBtn.click();
    await expect(
      hostPage.locator('[data-testid="impostor-count-value"]'),
    ).toHaveText("2");

    await hostPage.locator('[data-testid="confirm-options-button"]').click();
    await expect(hostPage.getByRole("dialog")).toBeHidden();

    // 3. Start Game
    const startBtn = hostPage.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 4. Role Reveal
    const impostors: typeof pages = [];
    const crewmates: typeof pages = [];

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

    // All proceed to drawing
    for (const item of pages) {
      const proceedBtn = item.page.locator(
        '[data-testid="proceed-to-drawing-btn"]',
      );
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // Helper to finish turns
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

    // 5. Round 1 Voting: Eject 1st Inkpostor
    await finishDrawingPhase();
    const imp1 = impostors[0];
    const imp2 = impostors[1];

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

    // Ejected impostor skips final guess if in IMPOSTOR_GUESS phase
    const skipGuessBtn1 = imp1.page.locator('[data-testid="skip-guess-btn"]');
    if (await skipGuessBtn1.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipGuessBtn1.click();
    }

    // Verify 1 Inkpostor remains
    for (const item of pages) {
      await expect(
        item.page.locator('[data-testid="impostor-ejected-remaining"]'),
      ).toBeVisible({ timeout: 15000 });
    }

    // 6. Round 2: Next Round ➔ WORD_REVEAL phase in HOT_WORD
    for (const item of pages) {
      const nextRoundBtn = item.page
        .locator(
          'button:has-text("Next Round"), button:has-text("Siguiente Ronda"), button:has-text("Següent Ronda")',
        )
        .first();
      if (await nextRoundBtn.isVisible()) {
        await nextRoundBtn.click();
      }
    }

    // In HOT_WORD mode, Round 2 shows WORD_REVEAL screen
    for (const item of pages) {
      const confirmWordBtn = item.page
        .locator(
          'button:has-text("Got it"), button:has-text("Entendido"), button:has-text("Entès")',
        )
        .first();
      if (
        await confirmWordBtn.isVisible({ timeout: 10000 }).catch(() => false)
      ) {
        await confirmWordBtn.click();
      }
    }

    // 7. Round 2 Voting & Final Ejection
    await finishDrawingPhase();

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

    const skipGuessBtn2 = imp2.page.locator('[data-testid="skip-guess-btn"]');
    if (await skipGuessBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipGuessBtn2.click();
    }

    for (const item of pages) {
      await expect(item.page.locator("body")).toContainText(
        /Defeated|Won|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await Promise.all([
      hostCtx.close(),
      p2Ctx.close(),
      p3Ctx.close(),
      p4Ctx.close(),
      p5Ctx.close(),
    ]);
  });
});
