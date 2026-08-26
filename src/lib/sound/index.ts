import { createBus } from "./engine";
import { EFFECTS, type SoundEffect } from "./effects";

export {
  enableAudioSessionPlayback,
  initAudioListeners,
  resetAudioContextForTesting,
  resumeAudioContext,
  unlockAudio,
} from "./engine";
export { SOUND_EFFECTS, type SoundEffect } from "./effects";
export {
  getCurrentMusicTrack,
  resetMusicForTesting,
  setMusicTrack,
  setMusicVolume,
  type MusicTrack,
} from "./music";

/** Plays one effect from the catalogue. Never throws: audio is not essential. */
export function playSoundEffect(effect: SoundEffect, volume = 0.7): void {
  if (volume <= 0) return;

  try {
    const bus = createBus(volume);
    if (!bus) return;
    EFFECTS[effect](bus);
    // Auto-disconnect bus gain node after playback to avoid graph node accumulation in WebKit
    setTimeout(() => {
      try {
        bus.out.disconnect();
      } catch {
        // Ignore
      }
    }, 3000);
  } catch {
    // Graceful fallback if the audio context or its nodes error
  }
}
