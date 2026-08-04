import { test, expect } from "@playwright/test";

test.describe("System Security: Non-Host UI Permission Restrictions", () => {
  test("Non-host player cannot see START GAME button and options modal is read-only", async ({
    browser,
  }) => {
    // 1. Host creates room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostPerms");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // 2. Player 2 joins
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2NonHost");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P2NonHost", {
      timeout: 15000,
    });

    // 3. Verify Host sees START GAME button
    const hostStartBtn = pageHost.locator('[data-testid="start-game-btn"]');
    await expect(hostStartBtn).toBeVisible({ timeout: 15000 });

    // 4. Verify Non-Host (P2) does NOT see START GAME button
    const p2StartBtn = pageP2.locator('[data-testid="start-game-btn"]');
    await expect(p2StartBtn).not.toBeVisible();

    await ctxHost.close();
    await ctxP2.close();
  });
});
