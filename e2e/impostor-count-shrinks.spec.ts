import { test, expect } from "@playwright/test";

// Two impostors need five players. When one of the five leaves, the room has to
// come back down to one on its own — for the host and for everyone reading the
// options with them.
test.describe("Impostor Count Follows The Room E2E Suite", () => {
  test("A player leaving brings the impostor count back into range for host and guests", async ({
    browser,
  }) => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext()),
    );
    const [hostPage, p2Page, p3Page, p4Page, p5Page] = await Promise.all(
      contexts.map((context) => context.newPage()),
    );

    // 1. Host creates the room
    await hostPage.goto("/");
    await hostPage.locator("#player-name").fill("Player1");
    await expect(
      hostPage.locator('[data-testid="create-room-btn"]'),
    ).toBeEnabled({ timeout: 15000 });
    await hostPage.locator('[data-testid="create-room-btn"]').click();
    await expect(
      hostPage.locator('[data-testid="room-code-display"]'),
    ).toBeVisible({ timeout: 15000 });
    const roomCode = (
      await hostPage.locator('[data-testid="room-code-display"]').innerText()
    ).trim();

    // 2. Four more players join, five in total
    const guests = [
      { name: "Player2", page: p2Page },
      { name: "Player3", page: p3Page },
      { name: "Player4", page: p4Page },
      { name: "Player5", page: p5Page },
    ];
    for (const { name, page } of guests) {
      await page.goto("/");
      await page.locator("#player-name").fill(name);
      await page.locator("#room-code").fill(roomCode);
      const joinBtn = page.locator('[data-testid="join-room-btn"]');
      await expect(joinBtn).toBeEnabled({ timeout: 15000 });
      await joinBtn.click();
      await expect(
        page.locator('[data-testid="room-code-display"]'),
      ).toBeVisible({ timeout: 15000 });
    }
    await expect(hostPage.locator("body")).toContainText("Player5", {
      timeout: 15000,
    });

    const openOptionsBtn = (page: typeof hostPage) =>
      page
        .locator(
          'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
        )
        .first();
    const impostorCount = (page: typeof hostPage) =>
      page.locator('[data-testid="impostor-count-value"]');

    // 3. Host asks for the second impostor the five players allow, and saves
    await openOptionsBtn(hostPage).click();
    await expect(hostPage.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    const increaseBtn = hostPage.locator(
      '[data-testid="increase-impostors-btn"]',
    );
    await expect(increaseBtn).toBeEnabled({ timeout: 10000 });
    await increaseBtn.click();
    await expect(impostorCount(hostPage)).toHaveText("2");
    await hostPage.locator('[data-testid="confirm-options-button"]').click();
    await expect(hostPage.getByRole("dialog")).toBeHidden({ timeout: 10000 });

    // 4. A guest watches the same setting, read-only
    await openOptionsBtn(p2Page).click();
    await expect(p2Page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(impostorCount(p2Page)).toHaveText("2", { timeout: 10000 });

    // 5. One of the five leaves: four players only allow one impostor
    await p5Page.close();

    // The guest's open modal follows the room down without being reopened
    await expect(impostorCount(p2Page)).toHaveText("1", { timeout: 15000 });
    await expect(
      p2Page.locator('[data-testid="reveal-teammates-suboption"]'),
    ).toBeHidden();

    // 6. ...and so has what the host saved, not just what their screen shows
    await openOptionsBtn(hostPage).click();
    await expect(hostPage.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(impostorCount(hostPage)).toHaveText("1");
    await expect(increaseBtn).toBeDisabled();
    await expect(
      hostPage.locator('[data-testid="decrease-impostors-btn"]'),
    ).toBeDisabled();

    await Promise.all(contexts.map((context) => context.close()));
  });
});
