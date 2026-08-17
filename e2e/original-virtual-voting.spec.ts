import { test, expect, type Page, type Browser } from "@playwright/test";

// The default shape of a spoken game: the virtual voting is off, so the table
// argues out loud and the round runs ROLE_REVEAL -> ORDER_INFO -> RESULTS. The
// voting screen is never reached, and the host is the one who opens the cards.
test.describe("Deep E2E: ORIGINAL without the virtual voting", () => {
  const setupLobby = async (
    browser: Browser,
    namePrefix: string,
    modeLabel = /Select Original mode/i,
  ) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill(`Host${namePrefix}`);
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    await pageHost.locator("button:has(svg.lucide-settings)").first().click();
    await pageHost.getByRole("button", { name: modeLabel }).click();

    // Nothing is turned on here: this is what the host gets by default.
    await expect(
      pageHost.getByRole("switch", { name: /toggle virtual voting/i }),
    ).toHaveAttribute("aria-checked", "false");
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    return { ctxHost, pageHost, roomCode };
  };

  const joinGuests = async (
    browser: Browser,
    roomCode: string,
    names: string[],
  ) => {
    const contexts = [];
    const pages: Page[] = [];
    for (const name of names) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto("/");
      await page.locator("#player-name").fill(name);
      await page.locator("#room-code").fill(roomCode);
      await page.locator('[data-testid="join-room-btn"]').click();
      contexts.push(ctx);
      pages.push(page);
    }
    return { contexts, pages };
  };

  const revealRoles = async (pages: Page[]) => {
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      // mousedown only: a full click would release and hide the card again
      await card.dispatchEvent("mousedown");
      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }
  };

  test("ends the game on the host's reveal, never opening the voting screen", async ({
    browser,
  }) => {
    const { ctxHost, pageHost, roomCode } = await setupLobby(
      browser,
      "NoVoting",
    );

    const { contexts, pages: guestPages } = await joinGuests(
      browser,
      roomCode,
      ["P2NoVoting", "P3NoVoting"],
    );
    const pages = [pageHost, ...guestPages];

    await expect(pageHost.locator("body")).toContainText("P3NoVoting", {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    await revealRoles(pages);

    // ORDER_INFO, and this time it is the last screen of the round
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Who Starts|Quién empieza/i,
        { timeout: 15000 },
      );
      await expect(page.locator("canvas")).toHaveCount(0);
      // No confirmation gate, and no round counter: there is only one round
      await expect(
        page.locator('[data-testid="confirm-order-btn"]'),
      ).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText(/Round 1|Ronda 1/i);
    }

    // Only the host can open the cards
    for (const page of guestPages) {
      await expect(
        page.locator('[data-testid="reveal-results-btn"]'),
      ).toHaveCount(0);
      await expect(page.locator("body")).toContainText(
        /Waiting for host to reveal|Esperando al anfitrión para revelar/i,
      );
    }

    await pageHost.locator('[data-testid="reveal-results-btn"]').click();

    // RESULTS for everyone: the impostors and the word, with no ejection and no
    // verdict — the table already knows who they voted for.
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /The Inkpostors?|Los Inkpostores|El Inkpostor/i,
        { timeout: 15000 },
      );
      await expect(
        page.locator('[data-testid="impostor-result-card"]').first(),
      ).toBeVisible();
      await expect(page.locator("body")).toContainText(
        /The secret word was|La palabra secreta era/i,
      );
      await expect(
        page.locator('[data-testid="ejected-player-card"]'),
      ).toHaveCount(0);
      await expect(page.locator('[data-testid="next-round-btn"]')).toHaveCount(
        0,
      );
    }

    // The game is over, so the host restarts it instead of playing a round two
    await expect(
      pageHost.locator('[data-testid="play-again-btn"]'),
    ).toBeVisible();
    for (const page of guestPages) {
      await expect(page.locator('[data-testid="play-again-btn"]')).toHaveCount(
        0,
      );
    }

    await ctxHost.close();
    for (const ctx of contexts) await ctx.close();
  });

  test("plays the same way in ORIGINAL + CHAOS, with the word the players wrote", async ({
    browser,
  }) => {
    const { ctxHost, pageHost, roomCode } = await setupLobby(
      browser,
      "ChaosNoVoting",
      /Select Original \+ Chaos mode/i,
    );

    const { contexts, pages: guestPages } = await joinGuests(
      browser,
      roomCode,
      ["P2ChaosNV", "P3ChaosNV"],
    );
    const pages = [pageHost, ...guestPages];

    await expect(pageHost.locator("body")).toContainText("P3ChaosNV", {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    // It opens on WORD_SELECTION, like the other chaos mode
    for (const [index, page] of pages.entries()) {
      const input = page.locator('[data-testid="custom-word-input"]');
      await expect(input).toBeVisible({ timeout: 15000 });
      await input.fill(`Palabra${index}`);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    await revealRoles(pages);

    await expect(pageHost.locator("body")).toContainText(
      /Who Starts|Quién empieza/i,
      { timeout: 15000 },
    );
    await pageHost.locator('[data-testid="reveal-results-btn"]').click();

    for (const page of pages) {
      await expect(
        page.locator('[data-testid="impostor-result-card"]').first(),
      ).toBeVisible({ timeout: 15000 });
      // The word is one of the ones the players typed, shown verbatim
      await expect(page.locator("body")).toContainText(/Palabra[0-2]/);
    }

    await ctxHost.close();
    for (const ctx of contexts) await ctx.close();
  });
});
