import { test, expect } from "@playwright/test";

test.describe("Deep E2E: Impostor Loses On The Last Attempt", () => {
  test("Lethal pool enabled ➔ Impostor guesses wrong ➔ game ends with the Inkpostor defeated", async ({
    browser,
  }) => {
    // 1. Host creates room & makes the guess pool lethal
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostLethal");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();

    const loseToggle = pageHost.getByRole("switch", {
      name: /losing on the last attempt|derrota al gastar|derrota en gastar/i,
    });
    await loseToggle.click();
    await expect(loseToggle).toHaveAttribute("aria-checked", "true");

    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Players 2 and 3 join
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Lethal");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Lethal");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Lethal", {
      timeout: 15000,
    });

    // 3. Start game & reveal roles, keeping the impostor's page
    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    let impostorPage = pageHost;

    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      // The card only shows the role while it is held down
      await card.dispatchEvent("mousedown");
      await page.waitForTimeout(200);

      if (await page.locator('img[alt="Inkpostor Logo"]').isVisible()) {
        impostorPage = page;
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // 4. The impostor spends their only attempt on a word that cannot match.
    // The guess button is hidden while they are the one drawing, so hand the
    // turn over first if the game happened to start on them.
    const guessControlBtn = impostorPage
      .locator('button[aria-label*="guess"i], button[aria-label*="adivinar"i]')
      .first();
    const doneTurnBtn = impostorPage.locator("button", {
      hasText: /^(Done|Hecho|Fet)$/,
    });
    // Whichever of the two the header settles on tells us whose turn it is
    await expect(guessControlBtn.or(doneTurnBtn).first()).toBeVisible({
      timeout: 15000,
    });
    if (await doneTurnBtn.isVisible()) {
      await doneTurnBtn.click();
    }
    await expect(guessControlBtn).toBeVisible({ timeout: 15000 });
    await guessControlBtn.click();

    const guessInput = impostorPage.locator(
      '[data-testid="impostor-guess-input"]',
    );
    await expect(guessInput).toBeVisible({ timeout: 10000 });
    await guessInput.fill("zzzznotaword");
    await impostorPage.locator('[data-testid="submit-guess-btn"]').click();

    // 5. Everyone lands on RESULTS with the crewmates winning, no ejection
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Inkpostor Defeated|Inkpostor Derrotado|Inkpostor Derrotat/i,
        { timeout: 15000 },
      );
      await expect(page.locator('[data-testid="play-again-btn"]')).toHaveCount(
        page === pageHost ? 1 : 0,
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
