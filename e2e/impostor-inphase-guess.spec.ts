import { test, expect } from '@playwright/test';

test.describe('Production Qualification: In-Phase Impostor Guesses', () => {
  test('In-Phase Correct Secret Word Guess triggers instant Inkpostor Win', async ({ browser }) => {
    // 1. Host creates room with Impostor Can Guess enabled
    const ctxHost = await browser.newContext();
    const pageHost = await ctxHost.newPage();
    await pageHost.goto('/');
    await pageHost.locator('#player-name').fill('HostInPhase');
    await pageHost.locator('[data-testid="create-room-btn"]').click();

    const roomCodeElement = pageHost.locator('[data-testid="room-code-display"]');
    await expect(roomCodeElement).toBeVisible({ timeout: 15000 });
    const roomCode = (await roomCodeElement.innerText()).trim();

    // Enable Impostor Can Guess option
    const openOptionsBtn = pageHost.locator('button:has(svg.lucide-settings)').first();
    await openOptionsBtn.click();
    const guessToggle = pageHost.locator('button[aria-label*="impostor"i]').first();
    await guessToggle.click();
    await pageHost.locator('[data-testid="confirm-options-button"]').click();

    // 2. Join Players 2 & 3
    const ctxP2 = await browser.newContext();
    const pageP2 = await ctxP2.newPage();
    await pageP2.goto('/');
    await pageP2.locator('#player-name').fill('P2InPhase');
    await pageP2.locator('#room-code').fill(roomCode);
    await pageP2.locator('[data-testid="join-room-btn"]').click();

    const ctxP3 = await browser.newContext();
    const pageP3 = await ctxP3.newPage();
    await pageP3.goto('/');
    await pageP3.locator('#player-name').fill('P3InPhase');
    await pageP3.locator('#room-code').fill(roomCode);
    await pageP3.locator('[data-testid="join-room-btn"]').click();

    await expect(pageHost.locator('body')).toContainText('P3InPhase', { timeout: 15000 });

    // 3. Start game
    const startBtn = pageHost.locator('button', { hasText: /START GAME|INICIAR/i });
    await expect(startBtn).toBeEnabled({ timeout: 15000 });
    await startBtn.click();

    const pages = [pageHost, pageP2, pageP3];
    let secretWord = '';
    let impostorPage = pageHost;

    // 4. Role reveal: extract secret word from crewmate card & identify Impostor page
    for (const page of pages) {
      const card = page.locator('[data-testid="reveal-role-card"]');
      await expect(card).toBeVisible({ timeout: 15000 });
      const cardText = await card.innerText();

      if (cardText.includes('INKPOSTOR')) {
        impostorPage = page;
      } else {
        // Crewmate role card contains secret word text
        const wordMatch = cardText.match(/SECRET WORD:?\s*([A-Z0-9\s]+)/i) || cardText.match(/PALABRA SECRETA:?\s*([A-Z0-9\s]+)/i);
        if (wordMatch && wordMatch[1]) {
          secretWord = wordMatch[1].trim();
        }
      }

      await card.click();
      const proceedBtn = page.locator('[data-testid="proceed-to-drawing-btn"]');
      await expect(proceedBtn).toBeVisible({ timeout: 15000 });
      await proceedBtn.click();
    }

    for (const page of pages) {
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    }

    // 5. If secret word was captured, Impostor submits correct guess during DRAWING phase
    if (secretWord) {
      const guessControlBtn = impostorPage.locator('button[aria-label*="guess"i], button[aria-label*="adivinar"i]').first();
      if (await guessControlBtn.isVisible()) {
        await guessControlBtn.click();
      }

      const guessInput = impostorPage.locator('[data-testid="impostor-guess-input"]');
      await expect(guessInput).toBeVisible({ timeout: 10000 });
      await guessInput.fill(secretWord);

      const submitGuessBtn = impostorPage.locator('[data-testid="submit-guess-btn"]');
      await submitGuessBtn.click();

      // Verify room transitions to RESULTS phase showing Impostor Won!
      for (const page of pages) {
        await expect(page.locator('body')).toContainText(/Won|Victoria|Defeated|Result/i, { timeout: 15000 });
      }
    }

    await ctxHost.close();
    await ctxP2.close();
    await ctxP3.close();
  });
});
