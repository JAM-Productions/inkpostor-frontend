import { test, expect } from '@playwright/test';

test.describe('Game Modes E2E Suite', () => {
  test('CLASSIC Mode: 3 players start game, reveal roles, and enter DRAWING phase', async ({ browser }) => {
    // Context 1: Host
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostClassic');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Context 2: Player 2
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('PlayerTwo');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    // Context 3: Player 3
    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('PlayerThree');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    // Ensure Host sees all 3 players in lobby
    await expect(pageHost.locator('body')).toContainText('PlayerThree', { timeout: 15000 });

    // Host starts game
    const startBtn = pageHost.locator('button', { hasText: /START GAME|INICIAR/i });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // All players see ROLE_REVEAL
    for (const page of [pageHost, pageP2, pageP3]) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // All players transition to DRAWING phase (canvas component loaded)
    for (const page of [pageHost, pageP2, pageP3]) {
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test('CUSTOM_WORD Mode (Chaos): 3 players enter custom words and reach DRAWING phase', async ({ browser }) => {
    // Context 1: Host
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostChaos');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Host selects CUSTOM_WORD (Chaos) mode in options
    const openOptionsBtn = pageHost.locator('button:has(svg.lucide-settings)').first();
    await openOptionsBtn.click();
    
    const nextModeBtn = pageHost.locator('button[aria-label*="Next"i], button[aria-label*="Siguiente"i]').first();
    await nextModeBtn.click();

    const closeOptionsBtn = pageHost.locator('[data-testid="close-modal-button"]').first();
    await closeOptionsBtn.click();

    // Context 2: Player 2
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2Chaos');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    // Context 3: Player 3
    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3Chaos');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    // Ensure Host sees P3Chaos in lobby before starting
    await expect(pageHost.locator('body')).toContainText('P3Chaos', { timeout: 15000 });

    // Host starts game
    const startBtn = pageHost.locator('button', { hasText: /START GAME|INICIAR/i });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // All players enter WORD_SELECTION phase
    const words = ['Dragon', 'Submarine', 'Spaceship'];
    const pages = [pageHost, pageP2, pageP3];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const wordInput = page.locator('[data-testid="custom-word-input"]');
      await expect(wordInput).toBeVisible({ timeout: 15000 });
      await wordInput.fill(words[i]);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    // All players transition to ROLE_REVEAL after words submitted
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // All players reach DRAWING canvas phase
    for (const page of pages) {
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
