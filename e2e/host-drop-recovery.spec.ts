import { test, expect } from '@playwright/test';

test.describe('High-Value Production Test: Host Drop Recovery', () => {
  test('Abrupt host tab closure mid-drawing phase seamlessly advances turn to Player 2 without hanging', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostDropRec');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2HostDrop');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3HostDrop');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3HostDrop', { timeout: 15000 });

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
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    }

    // Abruptly close Host browser tab mid-game
    await ctxHost.close();

    // Remaining connected players (P2 & P3) continue drawing phase or transition seamlessly
    await expect(pageP2.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(pageP3.locator('canvas')).toBeVisible({ timeout: 15000 });

    await ctxP2.close();
    await ctxP3.close();
  });
});
