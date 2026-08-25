import { createBus, tone, type Bus } from "./engine";

/**
 * The background music: two looping beds, scheduled ahead of time on the audio
 * clock rather than on timers.
 *
 * `lobby` is the only one with a tune. During play the bed is deliberately
 * *not* melodic: the timer ticks and the turn alert are information the player
 * is listening for, and a melody on top of them masks the clock. The results
 * screen gets no music at all, so the victory and defeat stings land in silence.
 */
export type MusicTrack = "lobby" | "tension";

/** How far ahead of the audio clock a loop is queued. */
const SCHEDULE_AHEAD = 0.6;
/** How often the scheduler wakes up to look, in milliseconds. */
const TICK_MS = 200;
/** Length of the cross-fade when a track starts, stops or is swapped. */
const FADE = 0.6;

interface Track {
  /** Seconds per loop. */
  readonly length: number;
  /** Level relative to the music volume: the play bed sits well under. */
  readonly level: number;
  readonly play: (bus: Bus, at: number) => void;
}

// --- The two beds ----------------------------------------------------------
//
// Both are in A minor, the key the stingers already live in.

const STEP = 0.3125; // eighth notes at 96 bpm

const LOBBY: Track = {
  length: STEP * 16,
  level: 1,
  play: (bus, at) => {
    // Am - Am - F - E, walking under the tune
    const bass: [number, number][] = [
      [0, 110],
      [2, 110],
      [4, 110],
      [6, 110],
      [8, 87.31],
      [10, 87.31],
      [12, 82.41],
      [14, 82.41],
    ];
    bass.forEach(([step, freq]) => {
      tone(bus, {
        type: "sawtooth",
        freq,
        at: at + step * STEP,
        duration: STEP * 1.6,
        peak: 0.13,
        attack: 0.02,
        filter: { type: "lowpass", freq: 340, sweepTo: 200 },
      });
    });

    // A plucked motif that rises and falls back, ending unresolved on B
    const melody: [number, number][] = [
      [0, 440],
      [2, 523.25],
      [4, 659.25],
      [6, 523.25],
      [8, 349.23],
      [10, 440],
      [12, 415.3],
      [14, 493.88],
    ];
    melody.forEach(([step, freq]) => {
      tone(bus, {
        type: "triangle",
        freq,
        at: at + step * STEP,
        duration: STEP * 1.2,
        peak: 0.1,
        reverb: 0.3,
      });
    });

    // One high plink per loop, for a bit of sparkle over the top
    tone(bus, {
      type: "sine",
      freq: 1318.51,
      at: at + 11 * STEP,
      duration: 0.5,
      peak: 0.05,
      reverb: 0.45,
    });
  },
};

const TENSION: Track = {
  length: 4.8,
  level: 0.55,
  play: (bus, at) => {
    // A drone that breathes: one long note per loop, opening and closing. It
    // runs past the end of its own loop so consecutive ones overlap — a drone
    // that stopped on the loop line would leave an audible hole every time.
    tone(bus, {
      type: "sawtooth",
      freq: 55,
      at: at,
      duration: 5.4,
      peak: 0.22,
      attack: 1.4,
      filter: { type: "lowpass", freq: 180, sweepTo: 320 },
      reverb: 0.25,
    });

    // A slow pulse, well below the timer ticks so it never competes with them
    [0, 1.2, 2.4, 3.6].forEach((offset) => {
      tone(bus, {
        type: "sine",
        freq: 73.42,
        slideTo: 55,
        at: at + offset,
        duration: 0.3,
        peak: 0.2,
        filter: { type: "lowpass", freq: 200 },
      });
    });

    // A single distant drip, moved around the loop so it never sounds cloned
    const drips = [880, 1046.5, 1244.51];
    tone(bus, {
      type: "sine",
      freq: drips[Math.floor(Math.random() * drips.length)],
      at: at + 1.5 + Math.random() * 2,
      duration: 0.9,
      peak: 0.05,
      reverb: 0.6,
    });
  },
};

const TRACKS: Record<MusicTrack, Track> = { lobby: LOBBY, tension: TENSION };

// --- The scheduler ---------------------------------------------------------

let current: MusicTrack | null = null;
let bus: Bus | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextLoopAt = 0;
let volume = 0;

export function resetMusicForTesting(): void {
  if (timer) clearInterval(timer);
  timer = null;
  bus = null;
  current = null;
  nextLoopAt = 0;
  volume = 0;
}

/** Fades the current bed out and lets its queued notes die with it. */
function fadeOutCurrent(): void {
  if (timer) clearInterval(timer);
  timer = null;
  if (bus) {
    const closing = bus;
    try {
      const now = closing.ctx.currentTime;
      closing.out.gain.cancelScheduledValues?.(now);
      closing.out.gain.setValueAtTime(closing.out.gain.value, now);
      closing.out.gain.linearRampToValueAtTime(0, now + FADE);
      // Its own bus is thrown away, so notes already queued on it cannot come
      // back when the next track fades in.
      setTimeout(
        () => closing.out.disconnect(),
        (FADE + SCHEDULE_AHEAD) * 1000,
      );
    } catch {
      // A bus that cannot be faded is simply dropped
    }
  }
  bus = null;
  current = null;
}

function schedule(): void {
  if (!bus || !current) return;
  try {
    const track = TRACKS[current];
    while (nextLoopAt < bus.ctx.currentTime + SCHEDULE_AHEAD) {
      // A tab left in the background stops firing timers; rather than queue up
      // the loops it missed, the bed picks up from wherever the clock is now.
      if (nextLoopAt < bus.ctx.currentTime) {
        nextLoopAt = bus.ctx.currentTime;
      }
      track.play(bus, nextLoopAt);
      nextLoopAt += track.length;
    }
  } catch {
    fadeOutCurrent();
  }
}

/**
 * Plays `track` on a loop, or stops the music when given `null`. Repeating the
 * track that is already playing does nothing, so the bed survives phase changes
 * and re-renders without restarting.
 */
export function setMusicTrack(track: MusicTrack | null, level: number): void {
  volume = Math.min(1, Math.max(0, level));

  if (track === current) {
    setMusicVolume(volume);
    return;
  }

  fadeOutCurrent();
  if (!track || volume <= 0) return;

  const next = createBus(0);
  if (!next) return;

  bus = next;
  current = track;
  try {
    const now = next.ctx.currentTime;
    next.out.gain.setValueAtTime(0, now);
    next.out.gain.linearRampToValueAtTime(
      volume * TRACKS[track].level,
      now + FADE,
    );
    nextLoopAt = now + 0.05;
    schedule();
    timer = setInterval(schedule, TICK_MS);
  } catch {
    fadeOutCurrent();
  }
}

/** Rides the level of whatever is playing, without interrupting it. */
export function setMusicVolume(level: number): void {
  volume = Math.min(1, Math.max(0, level));
  if (!bus || !current) return;
  try {
    const now = bus.ctx.currentTime;
    bus.out.gain.cancelScheduledValues?.(now);
    bus.out.gain.setValueAtTime(bus.out.gain.value, now);
    bus.out.gain.linearRampToValueAtTime(
      volume * TRACKS[current].level,
      now + 0.2,
    );
  } catch {
    // Leaving the level where it is beats tearing the music down
  }
}

export function getCurrentMusicTrack(): MusicTrack | null {
  return current;
}
