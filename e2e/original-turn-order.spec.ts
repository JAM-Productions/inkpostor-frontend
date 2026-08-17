import { test, expect, type Page, type Browser } from "@playwright/test";

// The turn order option decides how much of the speaking order the game hands
// out on ORDER_INFO, and whether it is drawn again on every round.
test.describe("Deep E2E: ORIGINAL Turn Order Options", () => {
  const setupLobby = async (
    browser: Browser,
    suffix: string,
    turnOrderLabel: RegExp,
  ) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill(`Host${suffix}`);
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    await pageHost.locator("button:has(svg.lucide-settings)").first().click();
    await pageHost
      .getByRole("button", { name: /Select Original mode/i })
      .click();
    await pageHost
      .locator('[data-testid="turn-order-section"]')
      .getByRole("radio")
      .filter({ hasText: turnOrderLabel })
      .click();
    // Off by default, and these rounds run through the voting screen
    await pageHost
      .getByRole("switch", { name: /toggle virtual voting/i })
      .click();
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const playerNames = [`Host${suffix}`, `P2${suffix}`, `P3${suffix}`];
    const contexts = [ctxHost];
    const pages: Page[] = [pageHost];
    for (const name of playerNames.slice(1)) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto("/");
      await page.locator("#player-name").fill(name);
      await page.locator("#room-code").fill(roomCode);
      await page.locator('[data-testid="join-room-btn"]').click();
      contexts.push(ctx);
      pages.push(page);
    }

    await expect(pageHost.locator("body")).toContainText(`P3${suffix}`, {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");
      await page.locator('[data-testid="proceed-to-drawing-btn"]').click();
    }

    return { contexts, pages, pageHost, playerNames };
  };

  // The order as the host sees it, one entry per row of the list.
  const readOrder = (page: Page) =>
    page.locator('[data-testid="turn-order-list"] > div').allTextContents();

  const playRoundToNextOrderScreen = async (pages: Page[]) => {
    for (const page of pages) {
      await page.locator('[data-testid="confirm-order-btn"]').click();
    }
    for (const page of pages) {
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 15000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }
    for (const page of pages) {
      const nextRoundBtn = page.locator('[data-testid="next-round-btn"]');
      await expect(nextRoundBtn).toBeVisible({ timeout: 15000 });
      await nextRoundBtn.click();
    }
  };

  test("FIXED_ORDER lists the whole order and keeps it between rounds", async ({
    browser,
  }) => {
    const { contexts, pages, pageHost } = await setupLobby(
      browser,
      "FixedOrder",
      /Fixed order|Orden predefinido|Ordre predefinit/i,
    );

    const list = pageHost.locator('[data-testid="turn-order-list"]');
    await expect(list).toBeVisible({ timeout: 15000 });
    // The full order replaces the single-starter card
    await expect(
      pageHost.locator('[data-testid="starting-player"]'),
    ).toHaveCount(0);

    const roundOne = await readOrder(pageHost);
    expect(roundOne).toHaveLength(3);

    await playRoundToNextOrderScreen(pages);

    await expect(pageHost.locator("body")).toContainText(/Round 2|Ronda 2/i, {
      timeout: 15000,
    });
    // Drawn once at startGame and kept: same players, same positions
    expect(await readOrder(pageHost)).toEqual(roundOne);

    for (const ctx of contexts) await ctx.close();
  });

  test("RANDOM_ORDER lists the whole order and keeps every player in it", async ({
    browser,
  }) => {
    const { contexts, pages, pageHost, playerNames } = await setupLobby(
      browser,
      "RandomOrder",
      /Random order|Orden aleatorio|Ordre aleatori/i,
    );
    // Each row reads "<position><initial><name>", so the raw strings move when
    // the order is redrawn. Compare who is listed, not where.
    const whoIsListed = (rows: string[]) =>
      rows.map((row) => playerNames.find((name) => row.includes(name))).sort();

    await expect(
      pageHost.locator('[data-testid="turn-order-list"]'),
    ).toBeVisible({ timeout: 15000 });
    const roundOne = await readOrder(pageHost);
    expect(roundOne).toHaveLength(3);

    await playRoundToNextOrderScreen(pages);

    await expect(pageHost.locator("body")).toContainText(/Round 2|Ronda 2/i, {
      timeout: 15000,
    });
    const roundTwo = await readOrder(pageHost);

    // This mode redraws the order every round. Asserting the draw actually
    // changed would be flaky with three players (1 in 6 of repeating), so the
    // reshuffle itself is covered by the gameManager unit tests; here we pin
    // that the round still opens on a full list holding exactly the same
    // players, whatever order they came out in.
    expect(roundTwo).toHaveLength(3);
    expect(whoIsListed(roundTwo)).toEqual(whoIsListed(roundOne));
    expect(whoIsListed(roundTwo)).toEqual([...playerNames].sort());

    for (const ctx of contexts) await ctx.close();
  });
});
