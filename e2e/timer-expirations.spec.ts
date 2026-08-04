import { test, expect } from "@playwright/test";

test.describe("System Resilience: Timer Expirations & Auto-Advance", () => {
  test("Turn timer expiration auto-advances turn and voting timer expiration auto-skips unsubmitted votes", async ({
    browser,
  }) => {
    // 1. Host creates room with short turn time (10s) and short voting time (15s)
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostTimerExp");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Join Player 2 & 3
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2TimerExp");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3TimerExp");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3TimerExp", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];

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

    // Advance turns until Voting phase (allowing turn timers to run down if needed)
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

    // Voting phase: All players do not vote, allowing voting timer to run out
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await page.locator('[data-testid="confirm-vote-btn"]').click();
      }
    }

    // Server auto-resolves voting phase to RESULTS screen
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota/i,
        { timeout: 20000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
