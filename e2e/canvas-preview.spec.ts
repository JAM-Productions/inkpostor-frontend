import { test, expect, type Page } from "@playwright/test";

/**
 * The one thing about the preview that unit tests cannot reach: authorship
 * surviving the round trip.
 *
 * Who drew a point is the server's word — it stamps the first point of every
 * batch it accepts and forwards what it stored, not the payload that arrived.
 * Both sides are tested against their own assumptions; only a real game proves
 * a real client is handed a real stamped stroke. If the stamp is lost anywhere
 * along the way the drawing is still there, and only this test notices: the
 * cast list comes back empty, or naming nobody.
 */
test.describe("E2E: Canvas preview authorship", () => {
  /** A stroke long enough to span several batches, drawn where the canvas is. */
  const drawOn = async (page: Page) => {
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) return;

    const midX = box.x + box.width / 2;
    const midY = box.y + box.height / 2;

    await page.mouse.move(midX - 60, midY - 40);
    await page.mouse.down();
    await page.mouse.move(midX, midY, { steps: 10 });
    await page.mouse.move(midX + 60, midY + 40, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  };

  test("the preview credits the players who really drew", async ({
    browser,
  }) => {
    // 1. Three players in a room
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostPreview");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("TwoPreview");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("ThreePreview");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("ThreePreview", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 2. Everyone reads their role and moves on to the canvas
    const players = [
      { page: pageHost, name: "HostPreview" },
      { page: pageP2, name: "TwoPreview" },
      { page: pageP3, name: "ThreePreview" },
    ];

    for (const { page } of players) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const { page } of players) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // 3. Whoever holds the turn draws something, then hands it on. What matters
    // is who actually put ink down: that is what the preview has to say back.
    const whoDrew: string[] = [];

    for (let turn = 0; turn < 6; turn++) {
      for (const { page, name } of players) {
        const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
        if (!(await doneBtn.isVisible())) continue;

        await drawOn(page);
        if (!whoDrew.includes(name)) whoDrew.push(name);

        await doneBtn.click();
        await page.waitForTimeout(300);
        break;
      }

      const reachedVoting = await pageHost
        .locator("body")
        .filter({ hasText: /Voting Time|Tiempo de votación/i })
        .isVisible();
      if (reachedVoting) break;
    }

    expect(whoDrew.length).toBeGreaterThan(1);

    await expect(pageHost.locator("body")).toContainText(
      /Voting Time|Tiempo de votación/i,
      { timeout: 15000 },
    );

    // 4. Make one player forget the drawing and take it again from the server.
    //
    // This is what makes the test worth having. A client that watched the game
    // happen can name the drawers off its own record of whose turn it was, so it
    // would light the preview up even with a server that stamped nothing. Only a
    // drawing taken whole from `canvasSync` proves the stamps are the server's:
    // it arrives as one payload, with no turns to remember it by.
    // A reload does it: the page comes back with nothing, walks into the room on
    // the name and id it kept, and is handed the drawing whole.
    await pageP2.goto(`/?room=${roomCode}`);
    await expect(pageP2.locator("body")).toContainText(
      /Voting Time|Tiempo de votación/i,
      { timeout: 20000 },
    );

    // 5. The point of all of it: every player who drew is named, and nothing on
    // the sheet is left to "Unknown", which is what an unstamped stroke becomes.
    const openPreviewBtn = pageP2.locator(
      '[data-testid="open-canvas-preview-btn"]',
    );
    await expect(openPreviewBtn).toBeVisible({ timeout: 15000 });
    await openPreviewBtn.click();

    // The replay says when it is done itself, so there is nothing to sleep on.
    const replayBtn = pageP2.locator('[data-testid="canvas-replay-btn"]');
    await expect(replayBtn).toBeVisible({ timeout: 15000 });
    await expect(replayBtn).toBeEnabled({ timeout: 15000 });

    const legend = pageP2.locator('[data-testid="canvas-preview-legend"]');
    await expect(legend).toBeVisible({ timeout: 15000 });

    for (const name of whoDrew) {
      await expect(legend).toContainText(name);
    }
    await expect(legend).not.toContainText(/Unknown|Desconocido/i);

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
