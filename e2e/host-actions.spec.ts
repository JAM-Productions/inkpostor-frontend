import { test, expect } from '@playwright/test';

test.describe('Production Qualification: Host Actions & Exit Game', () => {
  test('Host End Game: Host opens End Game modal mid-game and terminates match cleanly for all players', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostEndAction');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2EndAction');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3EndAction');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3EndAction', { timeout: 15000 });

    const startBtn = pageHost.locator('button', { hasText: /START GAME|INICIAR/i });
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

    // 2. Host clicks End Game button in header
    const endGameBtn = pageHost.locator('[data-testid="end-game-btn"]');
    await expect(endGameBtn).toBeVisible({ timeout: 15000 });
    await endGameBtn.click();

    // Confirm in End Game modal
    const confirmEndBtn = pageHost.locator('[data-testid="confirm-end-game-button"]');
    await expect(confirmEndBtn).toBeVisible({ timeout: 15000 });
    await confirmEndBtn.click();

    // 3. All players transition to RESULTS screen immediately
    for (const page of pages) {
      await expect(page.locator('body')).toContainText(/Inkpostor Won|Inkpostor Defeated|Defeated|Won|Result|Victoria|Derrota|Resultado/i, { timeout: 15000 });
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test('Exit Game: Player exits match mid-game and returns to JoinScreen', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostExitAction');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2ExitAction');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3ExitAction');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3ExitAction', { timeout: 15000 });

    const startBtn = pageHost.locator('button', { hasText: /START GAME|INICIAR/i });
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

    // 2. Player 2 clicks Exit Game button
    const exitBtn = pageP2.locator('button[aria-label*="exit"i], button[aria-label*="salir"i], button:has(svg.lucide-log-out)').first();
    await expect(exitBtn).toBeVisible({ timeout: 15000 });
    await exitBtn.click();

    // Confirm exit modal using confirm-exit-game-button
    const confirmExitBtn = pageP2.locator('[data-testid="confirm-exit-game-button"]').first();
    await expect(confirmExitBtn).toBeVisible({ timeout: 15000 });
    await confirmExitBtn.click();

    // Player 2 returns to JoinScreen
    await expect(pageP2.locator('#player-name')).toBeVisible({ timeout: 15000 });

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
