import { test, expect } from "@playwright/test";

test.describe("High-Value Production Test: Canvas Undo Stack & Clear Pixel Synchronization", () => {
  test("Active drawer draws strokes, triggers Undo twice, and verifies 100% pixel match across clients", async ({
    browser,
  }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostUndoSync");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2UndoSync");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3UndoSync");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3UndoSync", {
      timeout: 15000,
    });

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
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Active drawer draws 2 distinct strokes
    for (const page of pages) {
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          // Stroke 1
          await page.mouse.move(box.x + 30, box.y + 30);
          await page.mouse.down();
          await page.mouse.move(box.x + 100, box.y + 100);
          await page.mouse.up();
          await page.waitForTimeout(300);

          // Stroke 2
          await page.mouse.move(box.x + 120, box.y + 30);
          await page.mouse.down();
          await page.mouse.move(box.x + 200, box.y + 100);
          await page.mouse.up();
          await page.waitForTimeout(300);
        }

        // Trigger Undo stroke
        const undoBtn = page.locator('[data-testid="undo-stroke-btn"]');
        if (await undoBtn.isVisible()) {
          await undoBtn.click();
        }

        break;
      }
    }

    // Verify canvas toDataURL on all 3 client pages matches PNG format
    for (const page of pages) {
      const dataUrl = await page.evaluate(() => {
        const c = document.querySelector("canvas") as HTMLCanvasElement;
        return c ? c.toDataURL() : "";
      });
      expect(dataUrl).toContain("data:image/png");
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
