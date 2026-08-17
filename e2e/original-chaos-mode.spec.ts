import { test, expect, type Page } from "@playwright/test";

// ORIGINAL_CHAOS crosses two traits that already existed apart: the word is
// written by the players (WORD_SELECTION, like CUSTOM_WORD) and the round is
// spoken (ORDER_INFO instead of DRAWING, like ORIGINAL).
test.describe("Deep E2E: ORIGINAL + CHAOS Mode", () => {
  test("writes the word first, then runs the spoken round without a canvas", async ({
    browser,
  }) => {
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostOrigChaos");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    await pageHost.locator("button:has(svg.lucide-settings)").first().click();
    await pageHost
      .getByRole("button", { name: /Select Original \+ Chaos mode/i })
      .click();
    // Nothing is drawn here either, so the drawing options are gone
    await expect(
      pageHost.locator("body").getByText("Drawing Time per Round"),
    ).toHaveCount(0);
    await expect(
      pageHost.locator('[data-testid="turn-order-section"]'),
    ).toBeVisible();
    // Off by default, and this flow goes through the voting screen
    await pageHost
      .getByRole("switch", { name: /toggle virtual voting/i })
      .click();
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const contexts = [ctxHost];
    const pages: Page[] = [pageHost];
    for (const name of ["P2OrigChaos", "P3OrigChaos"]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto("/");
      await page.locator("#player-name").fill(name);
      await page.locator("#room-code").fill(roomCode);
      await page.locator('[data-testid="join-room-btn"]').click();
      contexts.push(ctx);
      pages.push(page);
    }

    await expect(pageHost.locator("body")).toContainText("P3OrigChaos", {
      timeout: 15000,
    });
    await pageHost.locator('[data-testid="start-game-btn"]').click();

    // WORD_SELECTION comes first, and it must not ask for a drawable word
    const words = ["Lighthouse", "Volcano", "Submarine"];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const wordInput = page.locator('[data-testid="custom-word-input"]');
      await expect(wordInput).toBeVisible({ timeout: 15000 });
      await expect(page.locator("body")).toContainText(
        /easy to describe out loud|describir en voz alta|descriure en veu alta/i,
      );
      await expect(page.locator("body")).not.toContainText(
        /something drawable|se pueda dibujar/i,
      );
      await wordInput.fill(words[i]);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    // ROLE_REVEAL: the secret word is one the players wrote
    let secretWord = "";
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.dispatchEvent("mousedown");
      const text = await card.innerText();
      if (!/INKPOSTOR/i.test(text)) {
        const match = words.find((word) => text.includes(word));
        expect(
          match,
          "a crewmate must see one of the submitted words",
        ).toBeTruthy();
        secretWord = match as string;
      }
      await page
        .locator('[data-testid="proceed-to-drawing-btn"]')
        .click({ force: true })
        .catch(() => {});
    }
    expect(words).toContain(secretWord);

    // ...and from there it behaves exactly like ORIGINAL
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Who Starts|Quién empieza/i,
        { timeout: 15000 },
      );
      await expect(page.locator("canvas")).toHaveCount(0);
      await page.locator('[data-testid="confirm-order-btn"]').click();
    }

    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
    }

    for (const ctx of contexts) await ctx.close();
  });
});
