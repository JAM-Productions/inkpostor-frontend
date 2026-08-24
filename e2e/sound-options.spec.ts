import { test, expect } from "@playwright/test";

test.describe("Sound and Volume Options E2E Suite", () => {
  test("Host and guest can toggle mute, adjust volume, and persist audio preferences", async ({
    page,
    browser,
  }) => {
    // 1. Host enters name and creates a room
    await page.goto("/");

    const nameInput = page.locator("#player-name");
    await expect(nameInput).toBeEnabled({ timeout: 15000 });
    await nameInput.fill("AudioHost");

    const createBtn = page.locator('[data-testid="create-room-btn"]');
    await createBtn.click();

    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible(
      { timeout: 15000 },
    );

    // 2. Test Topbar Sound Toggle button
    const topbarSoundBtn = page.locator('[data-testid="sound-toggle-btn"]');
    await expect(topbarSoundBtn).toBeVisible();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /mute sound|silenciar/i,
    );

    // Click topbar sound toggle to mute
    await topbarSoundBtn.click();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /unmute sound|activar/i,
    );

    // Click topbar sound toggle to unmute
    await topbarSoundBtn.click();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /mute sound|silenciar/i,
    );

    // 3. Open Options modal
    const openOptionsBtn = page
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();

    const optionsDialog = page.getByRole("dialog");
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });

    const soundSection = page.locator('[data-testid="sound-section"]');
    await expect(soundSection).toBeVisible();

    const volumeSlider = page.locator('[data-testid="sound-volume-slider"]');
    await expect(volumeSlider).toBeVisible();
    await expect(volumeSlider).toBeEnabled();

    const testSoundBtn = page.locator('[data-testid="sound-test-btn"]');
    await expect(testSoundBtn).toBeVisible();
    await expect(testSoundBtn).toBeEnabled();
    await testSoundBtn.click();

    // Adjust volume slider using fill
    await volumeSlider.fill("40");

    const volumeValue = page.locator('[data-testid="sound-volume-value"]');
    await expect(volumeValue).toHaveText("40%");

    // Toggle mute switch in options modal
    const muteSwitch = soundSection.locator('button[role="switch"]').first();
    await expect(muteSwitch).toHaveAttribute("aria-checked", "false");
    await muteSwitch.click();
    await expect(muteSwitch).toHaveAttribute("aria-checked", "true");

    // Slider and test button should now be disabled
    await expect(volumeSlider).toBeDisabled();
    await expect(testSoundBtn).toBeDisabled();
    await expect(volumeValue).toHaveText("0%");

    // Close options modal
    const closeBtn = page.locator('[data-testid="close-modal-button"]').first();
    await closeBtn.click();
    await expect(optionsDialog).toBeHidden({ timeout: 10000 });

    // 4. Verify persistence in localStorage and after page reload
    const roomCode = await page
      .locator('[data-testid="room-code-display"]')
      .innerText();

    const storedMuted = await page.evaluate(() =>
      localStorage.getItem("inkpostor_sound_muted"),
    );
    const storedVolume = await page.evaluate(() =>
      localStorage.getItem("inkpostor_sound_volume"),
    );
    expect(storedMuted).toBe("true");
    expect(storedVolume).toBe("0.4");

    await page.reload();
    await expect(topbarSoundBtn).toBeVisible();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /unmute sound|activar/i,
    );

    // Unmute via topbar
    await topbarSoundBtn.click();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /mute sound|silenciar/i,
    );
    const reloadedMuted = await page.evaluate(() =>
      localStorage.getItem("inkpostor_sound_muted"),
    );
    expect(reloadedMuted).toBe("false");

    // 5. Verify a second (guest) player also has functional sound controls
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto("/");

    const guestNameInput = guestPage.locator("#player-name");
    await expect(guestNameInput).toBeEnabled({ timeout: 15000 });
    await guestNameInput.fill("AudioGuest");

    const roomCodeInput = guestPage.locator("#room-code");
    await roomCodeInput.fill(roomCode.trim());

    const joinBtn = guestPage.locator('[data-testid="join-room-btn"]');
    await joinBtn.click();

    await expect(
      guestPage.locator('[data-testid="room-code-display"]'),
    ).toBeVisible({ timeout: 15000 });

    // Guest opens options modal
    const guestOptionsBtn = guestPage
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await guestOptionsBtn.click();

    const guestOptionsDialog = guestPage.getByRole("dialog");
    await expect(guestOptionsDialog).toBeVisible({ timeout: 10000 });

    // Guest can adjust sound options independently
    const guestSoundSection = guestPage.locator(
      '[data-testid="sound-section"]',
    );
    await expect(guestSoundSection).toBeVisible();

    const guestVolumeSlider = guestPage.locator(
      '[data-testid="sound-volume-slider"]',
    );
    await expect(guestVolumeSlider).toBeEnabled();

    const guestTestBtn = guestPage.locator('[data-testid="sound-test-btn"]');
    await expect(guestTestBtn).toBeEnabled();
    await guestTestBtn.click();

    await guestContext.close();
  });
});
