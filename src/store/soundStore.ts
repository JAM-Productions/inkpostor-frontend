import { create } from "zustand";
import { playSoundEffect, type SoundEffect } from "../lib/sound";

export const DEFAULT_SOUND_VOLUME = 0.7;
export const SOUND_VOLUME_KEY = "inkpostor_sound_volume";
export const SOUND_MUTED_KEY = "inkpostor_sound_muted";

export function getSavedSoundVolume(): number {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_SOUND_VOLUME;
  }
  try {
    const saved = window.localStorage.getItem(SOUND_VOLUME_KEY);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // Storage access might fail in restricted environments
  }
  return DEFAULT_SOUND_VOLUME;
}

export function getSavedSoundMuted(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const saved = window.localStorage.getItem(SOUND_MUTED_KEY);
    if (saved !== null) {
      return saved === "true";
    }
  } catch {
    // Storage access might fail
  }
  return false;
}

export function saveSoundVolume(volume: number): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
  } catch {
    // Ignore storage errors
  }
}

export function saveSoundMuted(muted: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(SOUND_MUTED_KEY, String(muted));
  } catch {
    // Ignore storage errors
  }
}

export interface SoundState {
  volume: number;
  muted: boolean;
  actions: {
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    toggleMute: () => void;
    playSound: (effect: SoundEffect) => void;
  };
}

export const useSoundStore = create<SoundState>()((set, get) => ({
  volume: getSavedSoundVolume(),
  muted: getSavedSoundMuted(),
  actions: {
    setVolume: (volume: number) => {
      const clamped = Math.min(1, Math.max(0, volume));
      saveSoundVolume(clamped);
      set({ volume: clamped });
    },
    setMuted: (muted: boolean) => {
      saveSoundMuted(muted);
      set({ muted });
    },
    toggleMute: () => {
      const nextMuted = !get().muted;
      saveSoundMuted(nextMuted);
      set({ muted: nextMuted });
    },
    playSound: (effect: SoundEffect) => {
      const { muted, volume } = get();
      if (muted || volume <= 0) return;
      playSoundEffect(effect, volume);
    },
  },
}));
