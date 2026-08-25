import { test, expect } from "@playwright/test";

test.describe("Sound and Volume Options E2E Suite", () => {
  test("Host and guest can toggle mute, adjust volume, and persist audio preferences via topbar popover", async ({
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

    // 2. Open Sound Settings popover from topbar
    const topbarSoundBtn = page.locator('[data-testid="sound-toggle-btn"]');
    await expect(topbarSoundBtn).toBeVisible();
    await expect(topbarSoundBtn).toHaveAttribute(
      "aria-label",
      /sound settings|ajustes de sonido|ajustos de so/i,
    );

    await topbarSoundBtn.click();

    const soundPopover = page.locator('[data-testid="sound-popover"]');
    await expect(soundPopover).toBeVisible();

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

    // Toggle master sound switch (ON -> OFF)
    const soundSwitch = soundPopover.locator('button[role="switch"]').first();
    await expect(soundSwitch).toHaveAttribute("aria-checked", "true");
    await soundSwitch.click();
    await expect(soundSwitch).toHaveAttribute("aria-checked", "false");

    // Slider and test button should now be disabled
    await expect(volumeSlider).toBeDisabled();
    await expect(testSoundBtn).toBeDisabled();
    await expect(volumeValue).toHaveText("0%");

    // Unmute sound
    await soundSwitch.click();
    await expect(soundSwitch).toHaveAttribute("aria-checked", "true");
    await expect(volumeSlider).toBeEnabled();
    await expect(volumeValue).toHaveText("40%");

    // Close sound popover
    await topbarSoundBtn.click();
    await expect(soundPopover).toBeHidden();

    // 3. Verify Options Modal is pure game options (no sound section inside)
    const openOptionsBtn = page
      .locator(
        'button[aria-label*="Options"i], button[aria-label*="Opciones"i], button:has(svg.lucide-settings)',
      )
      .first();
    await openOptionsBtn.click();

    const optionsDialog = page.getByRole("dialog");
    await expect(optionsDialog).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="sound-section"]')).toHaveCount(0);

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
    expect(storedMuted).toBe("false");
    expect(storedVolume).toBe("0.4");

    await page.reload();
    await expect(topbarSoundBtn).toBeVisible();

    // Open sound popover to verify value preserved after reload
    await topbarSoundBtn.click();
    await expect(soundPopover).toBeVisible();
    await expect(volumeValue).toHaveText("40%");
    await topbarSoundBtn.click();
    await expect(soundPopover).toBeHidden();

    // 5. Verify a second (guest) player also has functional independent sound controls
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

    // Guest opens sound settings from topbar
    const guestSoundBtn = guestPage.locator('[data-testid="sound-toggle-btn"]');
    await expect(guestSoundBtn).toBeVisible();
    await guestSoundBtn.click();

    const guestSoundPopover = guestPage.locator(
      '[data-testid="sound-popover"]',
    );
    await expect(guestSoundPopover).toBeVisible();

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
