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
  DEFAULT_MUSIC_VOLUME,
  MUSIC_VOLUME_KEY,
  MUSIC_ENABLED_KEY,
} from "../../src/store/soundStore";
import * as soundLib from "../../src/lib/sound";

vi.mock("../../src/lib/sound", () => ({
  playSoundEffect: vi.fn(),
  setMusicTrack: vi.fn(),
  unlockAudio: vi.fn(),
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

    it("plays sound and unlocks audio when not muted and volume > 0", () => {
      const { playSound } = useSoundStore.getState().actions;
      playSound("click");

      expect(soundLib.unlockAudio).toHaveBeenCalledTimes(1);
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

  describe("music", () => {
    beforeEach(() => {
      useSoundStore.setState({
        muted: false,
        musicEnabled: true,
        musicVolume: DEFAULT_MUSIC_VOLUME,
        musicTrack: null,
      });
    });

    it("starts the bed the phase asks for", () => {
      useSoundStore.getState().actions.setMusicTrack("lobby");

      expect(soundLib.setMusicTrack).toHaveBeenCalledWith(
        "lobby",
        DEFAULT_MUSIC_VOLUME,
      );
    });

    it("keeps its own volume, remembered separately from the effects", () => {
      useSoundStore.getState().actions.setMusicTrack("tension");
      useSoundStore.getState().actions.setMusicVolume(0.2);

      expect(localStorage.getItem(MUSIC_VOLUME_KEY)).toBe("0.2");
      expect(localStorage.getItem(SOUND_VOLUME_KEY)).toBeNull();
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith("tension", 0.2);
    });

    it("stops the music when its own switch goes off", () => {
      useSoundStore.getState().actions.setMusicTrack("lobby");
      useSoundStore.getState().actions.setMusicEnabled(false);

      expect(localStorage.getItem(MUSIC_ENABLED_KEY)).toBe("false");
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith(null, 0);
    });

    it("stops the music when the master mute goes on, and brings it back", () => {
      useSoundStore.getState().actions.setMusicTrack("tension");

      useSoundStore.getState().actions.setMuted(true);
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith(null, 0);

      useSoundStore.getState().actions.setMuted(false);
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith(
        "tension",
        DEFAULT_MUSIC_VOLUME,
      );
    });

    it("remembers the phase's track even while the music is off", () => {
      useSoundStore.getState().actions.setMusicEnabled(false);
      useSoundStore.getState().actions.setMusicTrack("tension");
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith(null, 0);

      // Turning it back on picks up whatever phase the game is in by then
      useSoundStore.getState().actions.setMusicEnabled(true);
      expect(soundLib.setMusicTrack).toHaveBeenLastCalledWith(
        "tension",
        DEFAULT_MUSIC_VOLUME,
      );
    });
  });
});
