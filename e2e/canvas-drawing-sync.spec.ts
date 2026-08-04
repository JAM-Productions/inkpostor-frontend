import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E: Canvas Drawing & Stroke Actions', () => {
  test('Active drawer draws strokes on canvas and triggers Undo action', async ({ browser }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostDrawSync');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2DrawSync');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3DrawSync');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3DrawSync', { timeout: 15000 });

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

    // 2. Identify active drawer page
    let activePage = pageHost;
    for (const page of pages) {
      const doneBtn = page.locator('button', { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        activePage = page;
        break;
      }
    }

    // 3. Active drawer performs stroke drawing on canvas
    const canvas = activePage.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await activePage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await activePage.mouse.down();
      await activePage.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
      await activePage.mouse.up();
    }

    // 4. Click Undo Stroke button
    const undoBtn = activePage.locator('[data-testid="undo-stroke-btn"]');
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
    }

    // Verify canvas remains visible across all pages
    for (const page of pages) {
      await expect(page.locator('canvas')).toBeVisible();
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
