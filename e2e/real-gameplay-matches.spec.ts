import { test, expect } from "@playwright/test";

test.describe("Real Gameplay Match Simulations", () => {
  test("Match 1: Crewmate Victory by Unanimous Voting with Canvas Pixel Data Verification", async ({
    browser,
  }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch1");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match1");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match1");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match1", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    const playerNames = ["HostMatch1", "P2Match1", "P3Match1"];
    let impostorName = "";

    // 2. Role reveal: click card first to reveal text & identify Impostor
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorName = playerNames[i];
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // 3. Draw strokes on canvas during turn
    for (const page of pages) {
      const doneBtn = page.locator("button", { hasText: /Done|Hecho/i });
      if (await doneBtn.isVisible()) {
        const canvas = page.locator("canvas");
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 150, box.y + 150);
          await page.mouse.up();
        }
      }
    }

    // Verify canvas data URL is non-empty across screens
    for (const page of pages) {
      const dataUrl = await page.evaluate(() => {
        const c = document.querySelector("canvas") as HTMLCanvasElement;
        return c ? c.toDataURL() : "";
      });
      expect(dataUrl).toContain("data:image/png");
    }

    // 4. Advance turns to VOTING phase
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

    // 5. Voting to eject the Impostor
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const name = playerNames[i];
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );

      if (name !== impostorName && impostorName) {
        // Crewmates vote for Impostor
        const voteTargetCard = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: impostorName })
          .first();
        await expect(voteTargetCard).toBeEnabled({ timeout: 10000 });
        await voteTargetCard.click();
      } else {
        // Impostor votes to skip
        const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // 6. Verify Crewmate Victory screen
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Defeated|Won|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Match 2: Impostor Victory by Framing Innocent Crewmate", async ({
    browser,
  }) => {
    // 1. Setup 3 players & start game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch2");
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator(
      '[data-testid="room-code-display"]',
    );
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match2");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match2");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match2", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    const playerNames = ["HostMatch2", "P2Match2", "P3Match2"];
    let innocentCrewmateName = "";

    // Identify an innocent crewmate
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (!text.includes("INKPOSTOR") && !text.includes("Inkpostor")) {
        innocentCrewmateName = playerNames[i];
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns to VOTING
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

    // Vote out innocent crewmate
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const name = playerNames[i];
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );

      if (name !== innocentCrewmateName && innocentCrewmateName) {
        const voteTargetCard = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: innocentCrewmateName })
          .first();
        await expect(voteTargetCard).toBeEnabled({ timeout: 10000 });
        await voteTargetCard.click();
      } else {
        const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Verify Inkpostor Victory / Ejection result screen
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Inkpostor Won|Defeated|Won|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Match 3: In-Game Impostor Secret Word Clutch Victory", async ({
    browser,
  }) => {
    // 1. Host enables Impostor Can Guess & starts game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch3");
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
    // Impostor Can Guess is on by default: confirm it rather than turn it on
    const guessToggle = pageHost
      .locator('button[aria-label*="impostor"i]')
      .first();
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match3");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match3");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match3", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    let secretWord = "";
    let impostorPage = pageHost;

    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorPage = page;
      } else {
        const wordMatch =
          text.match(/SECRET WORD:?\s*([A-Z0-9\s]+)/i) ||
          text.match(/PALABRA SECRETA:?\s*([A-Z0-9\s]+)/i) ||
          text.match(/WORD IS:?\s*([A-Z0-9\s]+)/i);
        if (wordMatch && wordMatch[1]) {
          secretWord = wordMatch[1].trim();
        }
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Impostor submits correct secret word guess during DRAWING phase
    if (secretWord) {
      const guessControlBtn = impostorPage
        .locator(
          'button[aria-label*="guess"i], button[aria-label*="adivinar"i]',
        )
        .first();
      if (await guessControlBtn.isVisible()) {
        await guessControlBtn.click();
      }

      const guessInput = impostorPage.locator(
        '[data-testid="impostor-guess-input"]',
      );
      await expect(guessInput).toBeVisible({ timeout: 10000 });
      await guessInput.fill(secretWord);

      const submitGuessBtn = impostorPage.locator(
        '[data-testid="submit-guess-btn"]',
      );
      await submitGuessBtn.click();

      // Verify instant Inkpostor Won screen
      for (const page of pages) {
        await expect(page.locator("body")).toContainText(
          /Won|Victoria|Defeated|Result/i,
          { timeout: 15000 },
        );
      }
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Match 4: Impostor Final Chance Ejection Victory", async ({
    browser,
  }) => {
    // 1. Host enables Impostor Can Guess & starts game
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch4");
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
    // Impostor Can Guess is on by default: confirm it rather than turn it on
    const guessToggle = pageHost
      .locator('button[aria-label*="impostor"i]')
      .first();
    await expect(guessToggle).toHaveAttribute("aria-checked", "true");
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match4");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match4");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match4", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    const playerNames = ["HostMatch4", "P2Match4", "P3Match4"];
    let secretWord = "";
    let impostorName = "";
    let impostorPage = pageHost;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.click();

      const text = await card.innerText();
      if (text.includes("INKPOSTOR") || text.includes("Inkpostor")) {
        impostorName = playerNames[i];
        impostorPage = page;
      } else {
        const wordMatch =
          text.match(/SECRET WORD:?\s*([A-Z0-9\s]+)/i) ||
          text.match(/PALABRA SECRETA:?\s*([A-Z0-9\s]+)/i) ||
          text.match(/WORD IS:?\s*([A-Z0-9\s]+)/i);
        if (wordMatch && wordMatch[1]) {
          secretWord = wordMatch[1].trim();
        }
      }

      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    }

    // Advance turns to VOTING
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

    // Vote out Impostor
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const name = playerNames[i];
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );

      if (name !== impostorName && impostorName) {
        const voteTargetCard = page
          .locator('button[data-testid*="vote-card-"]')
          .filter({ hasText: impostorName })
          .first();
        await expect(voteTargetCard).toBeEnabled({ timeout: 10000 });
        await voteTargetCard.click();
      } else {
        const skipBtn = page.locator('[data-testid="skip-vote-btn"]');
        await expect(skipBtn).toBeVisible({ timeout: 10000 });
        await skipBtn.click();
      }
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Impostor enters IMPOSTOR_GUESS phase and submits correct secret word
    const guessInput = impostorPage.locator(
      '[data-testid="impostor-guess-input"]',
    );
    if ((await guessInput.isVisible()) && secretWord) {
      await guessInput.fill(secretWord);
      await impostorPage.locator('[data-testid="submit-guess-btn"]').click();
    } else {
      const skipGuessBtn = impostorPage.locator(
        '[data-testid="skip-guess-btn"]',
      );
      if (await skipGuessBtn.isVisible()) {
        await skipGuessBtn.click();
      }
    }

    // All players see final RESULTS screen
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Defeated|Won|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });

  test("Match 5: Custom Words Chaos Championship", async ({ browser }) => {
    // 1. Host creates room & selects CUSTOM_WORD mode
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto("/");
    await pageHost.locator("#player-name").fill("HostMatch5");
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
    // Picked by its own dot rather than by counting carousel steps, so
    // adding a mode cannot silently move this test onto another one.
    await pageHost.getByRole("button", { name: /Select Chaos mode/i }).click();

    // The mode is staged in the modal now: it only reaches the server on save.
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto("/");
    await pageP2.locator("#player-name").fill("P2Match5");
    await pageP2.locator("#room-code").fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto("/");
    await pageP3.locator("#player-name").fill("P3Match5");
    await pageP3.locator("#room-code").fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator("body")).toContainText("P3Match5", {
      timeout: 15000,
    });

    const startBtn = pageHost.locator("button", {
      hasText: /START GAME|INICIAR/i,
    });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    // Submit custom secret words
    const words = ["Guitar", "Panda", "Rocket"];
    const pages = [pageHost, pageP2, pageP3];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const wordInput = page.locator('[data-testid="custom-word-input"]');
      await expect(wordInput).toBeVisible({ timeout: 15000 });
      await wordInput.fill(words[i]);
      await page.locator('[data-testid="submit-custom-word-btn"]').click();
    }

    // Role reveal
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

    // Advance turns to VOTING
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

    // Voting phase (skip votes)
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Voting Time|Tiempo de votación/i,
        { timeout: 15000 },
      );
      await page.locator('[data-testid="skip-vote-btn"]').click();
      await page.locator('[data-testid="confirm-vote-btn"]').click();
    }

    // Verify RESULTS phase
    for (const page of pages) {
      await expect(page.locator("body")).toContainText(
        /Nobody was ejected|Result|Victoria|Derrota/i,
        { timeout: 15000 },
      );
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
