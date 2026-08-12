import { test, expect } from "@playwright/test";

test.describe("Multiplayer E2E Flow", () => {
  test("Host creates a room and Player 2 joins in real-time", async ({
    browser,
  }) => {
    // 1. Setup Host browser context & page
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto("/");

    // Wait until health check finishes and inputs are enabled
    const nameInputHost = hostPage.locator("#player-name");
    await expect(nameInputHost).toBeEnabled({ timeout: 15000 });
    await nameInputHost.fill("HostPlayer");

    // Click Create Room button
    const createBtn = hostPage.locator('[data-testid="create-room-btn"]');
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Wait until Lobby is visible and room code is rendered
    const roomCodeElement = hostPage.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });

    const roomCode = (await roomCodeElement.innerText()).trim();
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

    // Verify Host sees themselves in the lobby
    await expect(hostPage.locator("body")).toContainText("HostPlayer");

    // 2. Setup Player 2 browser context & page
    const player2Context = await browser.newContext();
    const player2Page = await player2Context.newPage();

    await player2Page.goto("/");

    // Wait until health check finishes on player 2 page
    const nameInputPlayer2 = player2Page.locator("#player-name");
    await expect(nameInputPlayer2).toBeEnabled({ timeout: 15000 });
    await nameInputPlayer2.fill("PlayerTwo");

    const roomCodeInput = player2Page.locator("#room-code");
    await roomCodeInput.fill(roomCode);

    // Submit join form
    const joinBtn = player2Page.locator('[data-testid="join-room-btn"]');
    await expect(joinBtn).toBeEnabled();
    await joinBtn.click();

    // 3. Assert real-time synchronization between both player contexts
    const p2RoomCodeDisplay = player2Page.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(p2RoomCodeDisplay).toBeVisible({ timeout: 15000 });
    await expect(p2RoomCodeDisplay).toHaveText(roomCode, { timeout: 15000 });

    // Player 2 should see both HostPlayer and PlayerTwo in their lobby
    await expect(player2Page.locator("body")).toContainText("HostPlayer", {
      timeout: 15000,
    });
    await expect(player2Page.locator("body")).toContainText("PlayerTwo");

    // Host should receive the Socket event and see PlayerTwo appear live in the lobby
    await expect(hostPage.locator("body")).toContainText("PlayerTwo", {
      timeout: 15000,
    });

    // Cleanup contexts
    await hostContext.close();
    await player2Context.close();
  });
});
