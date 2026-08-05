import { test, expect, type Page, type Browser } from "@playwright/test";

// ORIGINAL is the in-person mode: nobody draws, so the round runs
// ROLE_REVEAL -> ORDER_INFO -> VOTING and the canvas is never reached.
test.describe("Deep E2E: ORIGINAL Mode", () => {
  // Host + two guests sitting in ORIGINAL, ready to start.
  const setupOriginalLobby = async (browser: Browser, namePrefix: string) => {
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
    // Picking the mode by its dot instead of counting "next" clicks, so adding
    // a mode to the carousel cannot silently move this test onto another one.
    await pageHost
      .getByRole("button", { name: /Select Original mode/i })
      .click();

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

  const skipVoteEveryone = async (pages: Page[]) => {
    for (const page of pages) {
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 15000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }
  };

  test("plays a full round loop without ever reaching a canvas", async ({
    browser,
  }) => {
    const { ctxHost, pageHost, roomCode } = await setupOriginalLobby(
      browser,
      "Original",
    );
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const { contexts, pages: guestPages } = await joinGuests(
      browser,
      roomCode,
      ["P2Original", "P3Original"],
    );
    const pages = [pageHost, ...guestPages];

    await expect(pageHost.locator("body")).toContainText("P3Original", {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    // ROLE_REVEAL: the button opens the round, it does not hand out a canvas,
    // so it must not offer to start drawing. It only appears once revealed.
    const hostCard = pageHost.locator('[data-testid="reveal-role-card"]');
    await expect(hostCard).toBeVisible({ timeout: 15000 });
    await hostCard.dispatchEvent("mousedown");
    await expect(
      pageHost.locator('[data-testid="proceed-to-drawing-btn"]'),
    ).toHaveText(/^\s*(Start|Empezar|Començar)\s*$/);

    await revealRoles(pages);

    // ORDER_INFO instead of DRAWING
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Who Starts|Quién empieza/i,
        { timeout: 15000 },
      );
      await expect(page.locator("canvas")).toHaveCount(0);
      // RANDOM_STARTER is the default: only the opener, no list
      await expect(
        page.locator('[data-testid="starting-player"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="turn-order-list"]')).toHaveCount(
        0,
      );
    }

    // textContent, not innerText: toHaveText normalises whitespace and the card
    // renders the avatar initial and the name as separate lines.
    const starterRoundOne = await pageHost
      .locator('[data-testid="starting-player"]')
      .textContent();

    // The gate waits for everyone: the phase only moves on the last confirm
    await pages[0].locator('[data-testid="confirm-order-btn"]').click();
    await pages[1].locator('[data-testid="confirm-order-btn"]').click();
    await expect(pageHost.locator("body")).toContainText(
      /Who Starts|Quién empieza/i,
    );
    await pages[2].locator('[data-testid="confirm-order-btn"]').click();

    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }
    await skipVoteEveryone(pages);

    // RESULTS -> next round goes back to ORDER_INFO, same opener, no canvas
    for (const page of pages) {
      const nextRoundBtn = page.locator('[data-testid="next-round-btn"]');
      await expect(nextRoundBtn).toBeVisible({ timeout: 15000 });
      await nextRoundBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("body")).toContainText(/Round 2|Ronda 2/i, {
        timeout: 15000,
      });
      await expect(page.locator("canvas")).toHaveCount(0);
    }
    // The order is fixed for the whole game: the same player opens round 2
    await expect(
      pageHost.locator('[data-testid="starting-player"]'),
    ).toHaveText(starterRoundOne ?? "");

    await ctxHost.close();
    for (const ctx of contexts) await ctx.close();
  });

  test("hides the category from the impostor when the host hides the hint", async ({
    browser,
  }) => {
    const { ctxHost, pageHost, roomCode } = await setupOriginalLobby(
      browser,
      "HideHint",
    );

    const hideHintToggle = pageHost.getByRole("switch", {
      name: /hiding the hint|amagar la pista|ocultar la pista/i,
    });
    await hideHintToggle.click();
    await expect(hideHintToggle).toHaveAttribute("aria-checked", "true");
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const { contexts, pages: guestPages } = await joinGuests(
      browser,
      roomCode,
      ["P2HideHint", "P3HideHint"],
    );
    const pages = [pageHost, ...guestPages];

    await expect(pageHost.locator("body")).toContainText("P3HideHint", {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    let impostorCards = 0;
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");
      const text = await card.innerText();

      if (/INKPOSTOR/i.test(text)) {
        impostorCards++;
        // The server never sends the category, so there is no hint to show
        expect(text).toMatch(/No hint this time|no hay pista|no hi ha pista/i);
        expect(text).not.toMatch(/Hint:|Pista:/i);
      } else {
        // Crewmates still get the word and its category
        expect(text).toMatch(/Category:|Categoría:|Categoria:/i);
      }
    }
    expect(impostorCards).toBe(1);

    await ctxHost.close();
    for (const ctx of contexts) await ctx.close();
  });
});
