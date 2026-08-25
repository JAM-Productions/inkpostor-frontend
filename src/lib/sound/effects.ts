import { noise, tone, type Bus } from "./engine";
import { nibScratch, sequence, thump, woodblock } from "./voices";

/**
 * The catalogue: one recipe per effect, each a short score written in the
 * gestures from `voices`. Adding an entry here is all it takes to add a sound —
 * `SoundEffect` is derived from these keys, so the type follows automatically.
 */
export const EFFECTS = {
  /** Pencil tapping the paper */
  click: (bus: Bus) => {
    noise(bus, {
      duration: 0.025,
      peak: 1.1,
      filter: { type: "bandpass", freq: 1800, q: 1.5 },
    });
    thump(bus, { freq: 420, to: 180, duration: 0.05, peak: 0.12 });
  },

  /** Tiny dry tap when swapping ink colour */
  colorPick: (bus: Bus) => {
    noise(bus, {
      duration: 0.015,
      peak: 1.2,
      filter: { type: "bandpass", freq: 2400, q: 4 },
    });
    tone(bus, { type: "sine", freq: 900, duration: 0.035, peak: 0.09 });
  },

  /** Cartoon boing followed by a friendly chime */
  playerJoin: (bus: Bus) => {
    tone(bus, {
      type: "triangle",
      freq: 700,
      slideTo: 260,
      duration: 0.22,
      peak: 0.24,
      vibrato: { rate: 22, depth: 90 },
    });
    tone(bus, {
      type: "triangle",
      freq: 1046.5,
      start: 0.2,
      duration: 0.32,
      peak: 0.22,
      reverb: 0.25,
    });
  },

  /** Low drone under a rising A-minor arpeggio: playful but uneasy */
  gameStart: (bus: Bus) => {
    tone(bus, {
      type: "sawtooth",
      freq: 55,
      duration: 1.2,
      peak: 0.16,
      attack: 0.12,
      filter: { type: "lowpass", freq: 400, sweepTo: 180 },
      reverb: 0.3,
    });
    sequence(bus, [220, 261.63, 329.63, 440], {
      type: "triangle",
      step: 0.1,
      duration: 0.32,
      peak: 0.28,
      reverb: 0.25,
    });
    tone(bus, {
      type: "triangle",
      freq: 880,
      start: 0.42,
      duration: 0.7,
      peak: 0.22,
      vibrato: { rate: 7, depth: 6 },
      reverb: 0.4,
    });
  },

  /** Suspense stinger, identical for every role so it never leaks who you are */
  roleReveal: (bus: Bus) => {
    noise(bus, {
      duration: 0.7,
      peak: 0.35,
      swell: true,
      filter: { type: "bandpass", freq: 2500, sweepTo: 5000, q: 0.8 },
      reverb: 0.5,
    });
    // Two drones a hair apart, beating against each other
    sequence(bus, [110, 110.6], {
      type: "sawtooth",
      step: 0,
      duration: 1.1,
      peak: 0.14,
      attack: 0.2,
      detune: 0,
      filter: { type: "lowpass", freq: 300, sweepTo: 900 },
      reverb: 0.4,
      last: { detune: 8 },
    });
    // Tritone bell over the drone: the classic "something is wrong" interval
    tone(bus, {
      type: "sine",
      freq: 622.25,
      start: 0.55,
      duration: 1.3,
      peak: 0.24,
      vibrato: { rate: 5, depth: 4 },
      reverb: 0.6,
    });
  },

  /** Quill flourish: an upward scrape closed by a chime */
  wordSelected: (bus: Bus) => {
    noise(bus, {
      duration: 0.22,
      peak: 0.7,
      swell: true,
      filter: { type: "bandpass", freq: 900, sweepTo: 4200, q: 1.2 },
    });
    sequence(bus, [659.25, 987.77], {
      type: "triangle",
      start: 0.18,
      step: 0.08,
      duration: 0.35,
      peak: 0.24,
      reverb: 0.3,
    });
  },

  /**
   * Nib dragging across paper. This one plays constantly while drawing, so it
   * stays quiet and randomised to avoid machine-gun repetition.
   */
  inkStroke: (bus: Bus) => {
    nibScratch(bus, 0, 0.9);
    thump(bus, { freq: 130, to: 80, duration: 0.05, peak: 0.05 });
  },

  /** Dry pen sputtering: three failing scratches, each weaker than the last */
  inkEmpty: (bus: Bus) => {
    [0, 0.09, 0.19].forEach((start, i) => {
      noise(bus, {
        start,
        duration: 0.05,
        peak: 1.3 - i * 0.3,
        rate: 1.2,
        filter: { type: "bandpass", freq: 3000 - i * 600, q: 5 },
      });
    });
    thump(bus, { freq: 300, to: 120, start: 0.2, duration: 0.22, peak: 0.14 });
  },

  /** Your turn: a bell and a sparkle, with a nib scratch for flavour */
  turnAlert: (bus: Bus) => {
    sequence(bus, [1174.66, 1567.98], {
      type: "sine",
      step: 0.07,
      duration: 0.5,
      peak: 0.3,
      reverb: 0.4,
      last: { duration: 0.4, peak: 0.18 },
    });
    nibScratch(bus, 0.24, 0.6);
  },

  /** Dry woodblock */
  timerTick: (bus: Bus) =>
    woodblock(bus, {
      clack: 1200,
      clackQ: 8,
      clackPeak: 1.5,
      freq: 640,
      to: 400,
      duration: 0.04,
      peak: 0.18,
    }),

  /** The same woodblock, tighter and higher: the last second is running out */
  timerTickFinal: (bus: Bus) =>
    woodblock(bus, {
      clack: 1900,
      clackQ: 10,
      clackPeak: 1.6,
      freq: 1000,
      to: 700,
      duration: 0.06,
      peak: 0.3,
      reverb: 0.25,
    }),

  /**
   * Meeting bell rung twice. The inharmonic partials above the strike are what
   * make it read as struck metal rather than as a plain tone.
   */
  emergencyAlert: (bus: Bus) => {
    const strikePartials: [number, number, number][] = [
      [1, 0.2, 0.9],
      [2.76, 0.08, 0.5],
      [5.4, 0.035, 0.35],
    ];
    tone(bus, {
      type: "sine",
      freq: 293.66,
      duration: 1.0,
      peak: 0.08,
      reverb: 0.4,
    });
    [0, 0.3].forEach((start) => {
      strikePartials.forEach(([ratio, peak, duration]) => {
        tone(bus, {
          type: "sine",
          freq: 587.33 * ratio,
          start,
          duration,
          peak,
          reverb: 0.45,
        });
      });
      // The clapper hitting the metal, under the ring itself
      noise(bus, {
        start,
        duration: 0.03,
        peak: 0.6,
        filter: { type: "bandpass", freq: 5000, q: 2 },
      });
    });
  },

  /** Eraser rubbing the page back and forth */
  undo: (bus: Bus) => {
    [0, 0.075].forEach((start, i) => {
      noise(bus, {
        start,
        duration: 0.07,
        peak: 1.2 - i * 0.3,
        rate: 0.6,
        filter: {
          type: "bandpass",
          freq: 900,
          sweepTo: i === 0 ? 1600 : 600,
          q: 1.2,
        },
      });
    });
  },

  /** Suspense pulse as the accusations start */
  heartbeat: (bus: Bus) => {
    const beat = { freq: 70, to: 40, duration: 0.18, cutoff: 200, reverb: 0.2 };
    thump(bus, { ...beat, peak: 0.35 });
    thump(bus, { ...beat, start: 0.28, peak: 0.24 });
  },

  /**
   * Nobody went out and the game goes on: an unresolved minor second over a
   * swelling drone, deliberately left hanging rather than landing.
   */
  suspense: (bus: Bus) => {
    tone(bus, {
      type: "sawtooth",
      freq: 82.41,
      duration: 1.5,
      peak: 0.18,
      attack: 0.35,
      filter: { type: "lowpass", freq: 260, sweepTo: 620 },
      reverb: 0.35,
    });
    sequence(bus, [466.16, 493.88], {
      type: "triangle",
      start: 0.25,
      step: 0.12,
      duration: 1.0,
      peak: 0.16,
      attack: 0.12,
      vibrato: { rate: 5.5, depth: 3 },
      reverb: 0.5,
    });
    // A held breath: the muted thump the drone rises out of
    thump(bus, { freq: 90, to: 55, duration: 0.22, peak: 0.3, cutoff: 220 });
  },

  /** Rubber stamp hitting paper */
  voteCast: (bus: Bus) => {
    noise(bus, {
      duration: 0.05,
      peak: 0.32,
      filter: { type: "lowpass", freq: 1400 },
    });
    thump(bus, { freq: 160, to: 50, duration: 0.14, peak: 0.35 });
    noise(bus, {
      start: 0.03,
      duration: 0.08,
      peak: 0.2,
      filter: { type: "highpass", freq: 4000 },
    });
  },

  /** Whoosh out of the airlock, slide whistle down, cartoon pop at the end */
  playerEjected: (bus: Bus) => {
    noise(bus, {
      duration: 0.5,
      peak: 0.5,
      attack: 0.08,
      filter: { type: "bandpass", freq: 3000, sweepTo: 300, q: 0.9 },
      reverb: 0.35,
    });
    tone(bus, {
      type: "sine",
      freq: 1200,
      slideTo: 180,
      duration: 0.55,
      peak: 0.18,
      vibrato: { rate: 6, depth: 12 },
    });
    thump(bus, {
      type: "triangle",
      freq: 300,
      to: 80,
      start: 0.52,
      duration: 0.1,
      peak: 0.28,
      reverb: 0.3,
    });
  },

  /** Sparkling magic arpeggio */
  impostorGuessCorrect: (bus: Bus) => {
    sequence(bus, [659.25, 880, 1318.51, 1760], {
      type: "triangle",
      step: 0.07,
      duration: 0.4,
      peak: 0.26,
      reverb: 0.45,
    });
    noise(bus, {
      start: 0.14,
      duration: 0.4,
      peak: 0.2,
      swell: true,
      filter: { type: "highpass", freq: 6000 },
      reverb: 0.5,
    });
  },

  /** Game-show buzzer that sags as it dies */
  impostorGuessWrong: (bus: Bus) =>
    sequence(bus, [110, 116.5], {
      type: "sawtooth",
      step: 0,
      slideRatio: 0.6,
      duration: 0.5,
      peak: 0.2,
      detune: 0,
      filter: { type: "lowpass", freq: 800, sweepTo: 400 },
      last: { detune: 10 },
    }),

  /** Bouncy fanfare with a sparkle tail */
  victory: (bus: Bus) => {
    sequence(bus, [523.25, 659.25, 783.99, 1046.5], {
      type: "triangle",
      step: 0.11,
      duration: 0.28,
      peak: 0.3,
      reverb: 0.35,
      last: { duration: 0.8, slideRatio: 1.02, vibrato: { rate: 7, depth: 8 } },
    });
    noise(bus, {
      start: 0.33,
      duration: 0.5,
      peak: 0.18,
      swell: true,
      filter: { type: "highpass", freq: 5000 },
      reverb: 0.45,
    });
  },

  /** Sad trombone: three droops and a final sagging note */
  defeat: (bus: Bus) =>
    sequence(bus, [349.23, 311.13, 277.18, 233.08], {
      type: "sawtooth",
      step: 0.28,
      duration: 0.3,
      peak: 0.22,
      attack: 0.03,
      vibrato: { rate: 6, depth: 7 },
      filter: { type: "lowpass", freq: 900, sweepTo: 500 },
      reverb: 0.3,
      last: { duration: 0.8, slideRatio: 0.89 },
    }),

  /**
   * Nobody won. Two voices slide in from above and below and meet on the same
   * note, and what they settle into is a sus4 chord — no third, so it lands as
   * neither the major of a victory nor the minor of a defeat.
   */
  stalemate: (bus: Bus) => {
    thump(bus, {
      freq: 110,
      to: 70,
      duration: 0.3,
      peak: 0.3,
      cutoff: 220,
      reverb: 0.2,
    });
    sequence(bus, [523.25, 293.66], {
      type: "triangle",
      step: 0,
      slideTo: 392,
      duration: 0.7,
      peak: 0.16,
      attack: 0.06,
      reverb: 0.35,
    });
    sequence(bus, [293.66, 392, 440], {
      type: "triangle",
      start: 0.62,
      step: 0,
      duration: 1.1,
      peak: 0.13,
      attack: 0.1,
      reverb: 0.5,
    });
    // The curtain coming down over the held chord
    noise(bus, {
      start: 0.55,
      duration: 0.5,
      peak: 0.25,
      filter: { type: "lowpass", freq: 1400, sweepTo: 400 },
      reverb: 0.3,
    });
  },

  /** Blunt "nope" blob */
  error: (bus: Bus) =>
    sequence(bus, [180, 174], {
      type: "sawtooth",
      step: 0,
      slideRatio: 0.55,
      duration: 0.3,
      peak: 0.2,
      detune: 0,
      filter: { type: "lowpass", freq: 500 },
      last: { detune: 12 },
    }),

  /** The Inkpostor motif: a nib scratch resolving into an A-minor triad */
  testSound: (bus: Bus) => {
    nibScratch(bus, 0, 0.9);
    sequence(bus, [440, 523.25, 659.25], {
      type: "triangle",
      start: 0.06,
      step: 0.08,
      duration: 0.3,
      peak: 0.26,
      reverb: 0.35,
      last: { duration: 0.6 },
    });
  },
} satisfies Record<string, (bus: Bus) => void>;

export type SoundEffect = keyof typeof EFFECTS;

/** Every effect in the catalogue — the list tests iterate over. */
export const SOUND_EFFECTS = Object.keys(EFFECTS) as SoundEffect[];
