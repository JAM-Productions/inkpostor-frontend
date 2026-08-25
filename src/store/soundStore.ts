import { create } from "zustand";
import {
  playSoundEffect,
  setMusicTrack,
  type MusicTrack,
  type SoundEffect,
} from "../lib/sound";

export const DEFAULT_SOUND_VOLUME = 0.7;
export const DEFAULT_MUSIC_VOLUME = 0.45;
export const SOUND_VOLUME_KEY = "inkpostor_sound_volume";
export const SOUND_MUTED_KEY = "inkpostor_sound_muted";
export const MUSIC_VOLUME_KEY = "inkpostor_music_volume";
export const MUSIC_ENABLED_KEY = "inkpostor_music_enabled";

/** A stored 0-1 level, or the default when there is nothing usable saved. */
function readLevel(key: string, fallback: number): number {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // Storage access might fail in restricted environments
  }
  return fallback;
}

function readFlag(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved !== null) return saved === "true";
  } catch {
    // Storage access might fail
  }
  return fallback;
}

function write(key: string, value: number | boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors
  }
}

export function getSavedSoundVolume(): number {
  return readLevel(SOUND_VOLUME_KEY, DEFAULT_SOUND_VOLUME);
}

export function getSavedSoundMuted(): boolean {
  return readFlag(SOUND_MUTED_KEY, false);
}

export function getSavedMusicVolume(): number {
  return readLevel(MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME);
}

export function getSavedMusicEnabled(): boolean {
  return readFlag(MUSIC_ENABLED_KEY, true);
}

export function saveSoundVolume(volume: number): void {
  write(SOUND_VOLUME_KEY, volume);
}

export function saveSoundMuted(muted: boolean): void {
  write(SOUND_MUTED_KEY, muted);
}

export interface SoundState {
  volume: number;
  muted: boolean;
  musicVolume: number;
  musicEnabled: boolean;
  /** What the current phase asks for; what actually plays also needs the toggle. */
  musicTrack: MusicTrack | null;
  actions: {
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    toggleMute: () => void;
    playSound: (effect: SoundEffect) => void;
    setMusicVolume: (volume: number) => void;
    setMusicEnabled: (enabled: boolean) => void;
    setMusicTrack: (track: MusicTrack | null) => void;
  };
}

export const useSoundStore = create<SoundState>()((set, get) => {
  /**
   * Pushes the current settings to the music engine, which decides for itself
   * whether that means starting a bed, swapping it, riding its level or
   * stopping. The master mute silences everything, music included, so all three
   * switches fold into the one level it gets.
   */
  const applyMusic = () => {
    const { muted, musicEnabled, musicVolume, musicTrack } = get();
    const level = muted || !musicEnabled ? 0 : musicVolume;
    setMusicTrack(level > 0 ? musicTrack : null, level);
  };

  return {
    volume: getSavedSoundVolume(),
    muted: getSavedSoundMuted(),
    musicVolume: getSavedMusicVolume(),
    musicEnabled: getSavedMusicEnabled(),
    musicTrack: null,
    actions: {
      setVolume: (volume: number) => {
        const clamped = Math.min(1, Math.max(0, volume));
        saveSoundVolume(clamped);
        set({ volume: clamped });
      },
      setMuted: (muted: boolean) => {
        saveSoundMuted(muted);
        set({ muted });
        applyMusic();
      },
      toggleMute: () => {
        const nextMuted = !get().muted;
        saveSoundMuted(nextMuted);
        set({ muted: nextMuted });
        applyMusic();
      },
      playSound: (effect: SoundEffect) => {
        const { muted, volume } = get();
        if (muted || volume <= 0) return;
        playSoundEffect(effect, volume);
      },
      setMusicVolume: (volume: number) => {
        const clamped = Math.min(1, Math.max(0, volume));
        write(MUSIC_VOLUME_KEY, clamped);
        set({ musicVolume: clamped });
        applyMusic();
      },
      setMusicEnabled: (enabled: boolean) => {
        write(MUSIC_ENABLED_KEY, enabled);
        set({ musicEnabled: enabled });
        applyMusic();
      },
      setMusicTrack: (track: MusicTrack | null) => {
        set({ musicTrack: track });
        applyMusic();
      },
    },
  };
});
