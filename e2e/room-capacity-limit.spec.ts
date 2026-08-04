import { test, expect } from '@playwright/test';

test.describe('System Limit Guard: Room Capacity Limit (10 Players)', () => {
  test('10 players fill lobby and 11th player join attempt is handled gracefully', async ({ browser }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostCapLimit');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Join 9 players (10 total including host)
    const contexts = [ctxHost];
    const pages = [pageHost];

    for (let i = 2; i <= 10; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto('/');
      await page.locator('#player-name').fill(`Player${i}Cap`);
      await page.locator('#room-code').fill(roomCode);
      await page.locator('[data-testid="join-room-btn"]').click();
      contexts.push(ctx);
      pages.push(page);
    }

    // Verify 10th player is visible in host lobby
    await expect(pageHost.locator('body')).toContainText('Player10Cap', { timeout: 15000 });

    // 3. Attempt 11th player join
    const ctxP11 = await browser.newContext();
    const pageP11 = await ctxP11.newPage();
    await pageP11.goto('/');
    await pageP11.locator('#player-name').fill('Player11Excess');
    await pageP11.locator('#room-code').fill(roomCode);
    await pageP11.locator('[data-testid="join-room-btn"]').click();

    // 11th player remains on JoinScreen input
    await expect(pageP11.locator('#player-name')).toBeVisible({ timeout: 15000 });

    for (const ctx of contexts) await ctx.close();
    await ctxP11.close();
  });
});
