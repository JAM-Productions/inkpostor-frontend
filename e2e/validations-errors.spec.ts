import { test, expect } from "@playwright/test";

test.describe("Comprehensive E2E: Room & Form Validations", () => {
  test("Room Creation & Joining: Entering room code connects and joins room seamlessly", async ({
    page,
  }) => {
    await page.goto("/");

    const nameInput = page.locator("#player-name");
    await expect(nameInput).toBeEnabled({ timeout: 15000 });
    await nameInput.fill("ValidUser");

    const codeInput = page.locator("#room-code");
    await codeInput.fill("NONEXI");

    const joinBtn = page.locator('[data-testid="join-room-btn"]');
    await expect(joinBtn).toBeEnabled({ timeout: 5000 });
    await joinBtn.click();

    // Verify room code display shows NONEXI in lobby
    await expect(page.locator('[data-testid="room-code-display"]')).toHaveText(
      "NONEXI",
      { timeout: 15000 },
    );
  });

  test("Player Count Guard: START GAME button remains disabled with < 3 connected players", async ({
    browser,
  }) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostGuardUser");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Player 2 joins (2 players total)
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2GuardUser");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P2GuardUser", {
      timeout: 15000,
    });

    // Host verifies START GAME button is disabled
    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeDisabled({ timeout: 5000 });

    await ctxHost.close();
    await ctxP2.close();
  });
});
