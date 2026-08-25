import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useSoundStore,
  SOUND_VOLUME_KEY,
  SOUND_MUTED_KEY,
  getSavedSoundVolume,
  getSavedSoundMuted,
  saveSoundVolume,
  saveSoundMuted,
  DEFAULT_SOUND_VOLUME,
} from "../../src/store/soundStore";
import * as soundLib from "../../src/lib/sound";

vi.mock("../../src/lib/sound", () => ({
  playSoundEffect: vi.fn(),
}));

describe("soundStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useSoundStore.setState({
      volume: DEFAULT_SOUND_VOLUME,
      muted: false,
    });
  });

  describe("storage helpers", () => {
    it("returns default volume when nothing is stored", () => {
      expect(getSavedSoundVolume()).toBe(DEFAULT_SOUND_VOLUME);
    });

    it("reads and parses valid stored volume", () => {
      localStorage.setItem(SOUND_VOLUME_KEY, "0.4");
      expect(getSavedSoundVolume()).toBe(0.4);
    });

    it("falls back to default volume on invalid stored volume", () => {
      localStorage.setItem(SOUND_VOLUME_KEY, "invalid");
      expect(getSavedSoundVolume()).toBe(DEFAULT_SOUND_VOLUME);

      localStorage.setItem(SOUND_VOLUME_KEY, "1.5");
      expect(getSavedSoundVolume()).toBe(DEFAULT_SOUND_VOLUME);
    });

    it("reads stored muted boolean", () => {
      expect(getSavedSoundMuted()).toBe(false);
      localStorage.setItem(SOUND_MUTED_KEY, "true");
      expect(getSavedSoundMuted()).toBe(true);
    });

    it("saves volume and muted to localStorage", () => {
      saveSoundVolume(0.85);
      expect(localStorage.getItem(SOUND_VOLUME_KEY)).toBe("0.85");

      saveSoundMuted(true);
      expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("true");
    });
  });

  describe("store actions", () => {
    it("updates volume and persists to localStorage", () => {
      const { setVolume } = useSoundStore.getState().actions;
      setVolume(0.5);

      expect(useSoundStore.getState().volume).toBe(0.5);
      expect(localStorage.getItem(SOUND_VOLUME_KEY)).toBe("0.5");
    });

    it("clamps volume between 0 and 1", () => {
      const { setVolume } = useSoundStore.getState().actions;
      setVolume(1.5);
      expect(useSoundStore.getState().volume).toBe(1);

      setVolume(-0.2);
      expect(useSoundStore.getState().volume).toBe(0);
    });

    it("updates muted and persists to localStorage", () => {
      const { setMuted } = useSoundStore.getState().actions;
      setMuted(true);

      expect(useSoundStore.getState().muted).toBe(true);
      expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("true");
    });

    it("toggles mute state and persists", () => {
      const { toggleMute } = useSoundStore.getState().actions;
      expect(useSoundStore.getState().muted).toBe(false);

      toggleMute();
      expect(useSoundStore.getState().muted).toBe(true);
      expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("true");

      toggleMute();
      expect(useSoundStore.getState().muted).toBe(false);
      expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("false");
    });

    it("plays sound when not muted and volume > 0", () => {
      const { playSound } = useSoundStore.getState().actions;
      playSound("click");

      expect(soundLib.playSoundEffect).toHaveBeenCalledWith(
        "click",
        DEFAULT_SOUND_VOLUME,
      );
    });

    it("does not play sound when muted", () => {
      useSoundStore.setState({ muted: true });
      const { playSound } = useSoundStore.getState().actions;
      playSound("click");

      expect(soundLib.playSoundEffect).not.toHaveBeenCalled();
    });

    it("does not play sound when volume is 0", () => {
      useSoundStore.setState({ volume: 0 });
      const { playSound } = useSoundStore.getState().actions;
      playSound("click");

      expect(soundLib.playSoundEffect).not.toHaveBeenCalled();
    });
  });
});
