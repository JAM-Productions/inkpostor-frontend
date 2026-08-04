import { test, expect } from '@playwright/test';

test.describe('Backend Docs Edge Cases & Parity', () => {
  test('Lobby Host Kick: Host kicks player from LOBBY, target is removed and returned to JoinScreen', async ({ browser }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostLobbyKick');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Player 2 joins
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2LobbyKick');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P2LobbyKick', { timeout: 15000 });

    // 3. Host kicks P2LobbyKick
    const kickBtn = pageHost.locator('button[aria-label*="P2LobbyKick"i], button[data-testid*="lobby-kick-btn-"]').first();
    await expect(kickBtn).toBeVisible({ timeout: 10000 });
    await kickBtn.click();

    const confirmKickBtn = pageHost.locator('button[aria-label*="confirm"i], button[data-testid*="confirm-lobby-kick-btn-"]').first();
    await expect(confirmKickBtn).toBeVisible({ timeout: 10000 });
    await confirmKickBtn.click();

    // 4. Player 2 is removed from room and returned to JoinScreen
    await expect(pageP2.locator('#player-name')).toBeVisible({ timeout: 15000 });
    await expect(pageHost.locator('body')).not.toContainText('P2LobbyKick');

    await ctxHost.close();
    await ctxP2.close();
  });

  test('VOTING Last Voter Disconnect: Disconnection of last pending voter resolves voting phase immediately', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostVoterDis');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2VoterDis');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3VoterDis');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3VoterDis', { timeout: 15000 });

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

    // Advance turns to VOTING
    for (let turn = 0; turn < 6; turn++) {
      for (const page of pages) {
        const doneBtn = page.locator('button', { hasText: /Done|Hecho/i });
        if (await doneBtn.isVisible()) {
          await doneBtn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      if (await pageHost.locator('body').filter({ hasText: /Voting Time|Tiempo de votación/i }).isVisible()) {
        break;
      }
    }

    // Host and P2 cast votes
    for (const page of [pageHost, pageP2]) {
      await expect(page.locator('body')).toContainText(/Voting Time|Tiempo de votación/i, { timeout: 15000 });
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 10000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // P3 (the last pending voter) closes browser context / disconnects
    await ctxP3.close();

    // Voting phase resolves immediately for remaining connected players
    await expect(pageHost.locator('body')).toContainText(/Nobody was ejected|Result|Victoria|Derrota/i, { timeout: 15000 });

    await ctxHost.close();
    await ctxP2.close();
  });

  test('RESULTS Last Unconfirmed Player Disconnect: Disconnection of last unconfirmed player starts Next Round automatically', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostNextRndDis');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2NextRndDis');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3NextRndDis');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3NextRndDis', { timeout: 15000 });

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

    // Advance turns to VOTING
    for (let turn = 0; turn < 6; turn++) {
      for (const page of pages) {
        const doneBtn = page.locator('button', { hasText: /Done|Hecho/i });
        if (await doneBtn.isVisible()) {
          await doneBtn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      if (await pageHost.locator('body').filter({ hasText: /Voting Time|Tiempo de votación/i }).isVisible()) {
        break;
      }
    }

    // All skip vote -> Nobody ejected -> RESULTS phase
    for (const page of pages) {
      await expect(page.locator('body')).toContainText(/Voting Time|Tiempo de votación/i, { timeout: 15000 });
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 10000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Host and P2 click Next Round
    for (const page of [pageHost, pageP2]) {
      const nextRoundBtn = page.locator('[data-testid="next-round-btn"]');
      await expect(nextRoundBtn).toBeVisible({ timeout: 15000 });
      await nextRoundBtn.click();
    }

    // P3 (the last unconfirmed player) closes context / disconnects
    await ctxP3.close();

    // Round 2 DRAWING phase starts automatically for remaining connected players
    await expect(pageHost.locator('canvas')).toBeVisible({ timeout: 15000 });

    await ctxHost.close();
    await ctxP2.close();
  });
});
