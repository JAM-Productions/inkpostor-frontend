import { noise, tone, type Bus, type ToneOptions } from "./engine";

/**
 * The gestures the effects are written in: a note sequence, a low blip, a
 * woodblock and the game's own nib scratch. They sit between the raw engine
 * primitives and the catalogue so the recipes read as sound design rather than
 * as node wiring.
 *
 * Narrow filters throw away most of the noise energy, so the gain values on
 * `noise` voices are multipliers on an already-quiet signal and run much higher
 * than the ones on `tone` voices. Peaks are matched by measurement, not by
 * matching the raw numbers.
 */

export interface SequenceOptions extends Omit<ToneOptions, "freq"> {
  /** Seconds between one note and the next. Zero stacks them into a chord. */
  step: number;
  /** Merged into the final note, which usually rings on past the others. */
  last?: Partial<ToneOptions>;
}

/** Notes on one shared setting, spaced by `step` from `start`. */
export function sequence(
  bus: Bus,
  freqs: number[],
  { step, last, ...options }: SequenceOptions,
): void {
  freqs.forEach((freq, i) => {
    tone(bus, {
      ...options,
      freq,
      start: (options.start ?? 0) + i * step,
      ...(i === freqs.length - 1 ? last : undefined),
    });
  });
}

export interface ThumpOptions {
  freq: number;
  /** Where the pitch drops to: what makes it a thump and not a beep. */
  to: number;
  duration: number;
  peak: number;
  start?: number;
  type?: OscillatorType;
  /** Lowpass cutoff, for the ones that should sound muffled. */
  cutoff?: number;
  reverb?: number;
}

/** A short falling blip: taps, stamps, pops and heartbeats. */
export function thump(bus: Bus, options: ThumpOptions): void {
  tone(bus, {
    type: options.type ?? "sine",
    freq: options.freq,
    slideTo: options.to,
    start: options.start,
    duration: options.duration,
    peak: options.peak,
    filter: options.cutoff
      ? { type: "lowpass", freq: options.cutoff }
      : undefined,
    reverb: options.reverb,
  });
}

export interface WoodblockOptions extends ThumpOptions {
  /** Centre of the clack that opens it. */
  clack: number;
  clackQ: number;
  clackPeak: number;
}

/** A dry tick: a filtered clack with a pitched blip inside it. */
export function woodblock(
  bus: Bus,
  { clack, clackQ, clackPeak, ...blip }: WoodblockOptions,
): void {
  noise(bus, {
    duration: 0.02,
    peak: clackPeak,
    filter: { type: "bandpass", freq: clack, q: clackQ },
  });
  thump(bus, blip);
}

/** A quick nib scratch on paper: the signature texture of the game. */
export function nibScratch(bus: Bus, start = 0, peak = 0.9): void {
  noise(bus, {
    start,
    duration: 0.07,
    peak,
    rate: 0.8 + Math.random() * 0.6,
    filter: {
      type: "bandpass",
      freq: 2200 + Math.random() * 1600,
      sweepTo: 1400,
      q: 3.5,
    },
  });
}
