import { test, expect } from "@playwright/test";

test.describe("Deep E2E: Full CUSTOM_WORD (Chaos) Game Loop", () => {
  test("Chaos Mode: Custom words entry ➔ Role Reveal ➔ Drawing ➔ Voting ➔ Results", async ({
    browser,
  }) => {
    // 1. Host creates room & selects CUSTOM_WORD mode
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostFullChaos");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Select Chaos mode
    const openOptionsBtn = pageHost
      .locator("button:has(svg.lucide-settings)")
      .first();
    await openOptionsBtn.click();
    // Picked by its own dot rather than by counting carousel steps, so
    // adding a mode cannot silently move this test onto another one.
    await pageHost.getByRole("button", { name: /Select Chaos mode/i }).click();

    // The mode is staged in the modal now: it only reaches the server on save.
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Players 2 and 3 join
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2FullChaos");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3FullChaos");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3FullChaos", {
      timeout: 15000,
    });

    // 3. Host starts game
    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // 4. WORD_SELECTION phase: Submit custom words
    const words = ["Telescope", "Pyramid", "Helicopter"];
    const pages = [pageHost, pageP2, pageP3];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const wordInput = page.locator('[data-testid="custom-word-input"]');
      await expect(wordInput).toBeVisible({ timeout: 15000 });
      await wordInput.fill(words[i]);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    // 5. ROLE_REVEAL phase
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    // 6. DRAWING phase ➔ Advance turns to VOTING
    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    for (let turn = 0; turn < 6; turn++) {
      for (const page of pages) {
        const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
        if (await doneBtn.isVisible()) {
          await doneBtn.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      if (
        await pageHost
          .locator("body")
          .filter({ hasText: /Voting Time|Tiempo de votación/i })
          .isVisible()
      ) {
        break;
      }
    }

    // 7. VOTING phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
      await expect(skipBtn).toBeVisible({ timeout: 15000 });
      await skipBtn.click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // 8. RESULTS phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota|Defeated|Won|Ejected/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
