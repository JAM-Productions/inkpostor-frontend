/**
 * The synthesiser the game's sound effects are built from.
 *
 * Two primitives carry everything: `tone` for pitched material and `noise` for
 * the paper, ink and whoosh textures. Both share an envelope, an optional
 * filter and a send to one reverb, so every effect lands in the same room.
 */

const SILENCE = 0.0001;

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let reverbNode: ConvolverNode | null = null;

export function resetAudioContextForTesting(): void {
  audioCtx = null;
  noiseBuffer = null;
  reverbNode = null;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtxClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioCtxClass();
    } catch {
      return null;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/** Two seconds of white noise, generated once and re-used by every burst. */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
  if (noiseBuffer) return noiseBuffer;
  try {
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  } catch {
    return null;
  }
}

/** Convolver fed with a synthetic decaying-noise impulse response. */
function getReverb(ctx: AudioContext): ConvolverNode | null {
  if (reverbNode) return reverbNode;
  try {
    const length = Math.floor(ctx.sampleRate * 1.6);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    convolver.connect(ctx.destination);
    reverbNode = convolver;
    return convolver;
  } catch {
    return null;
  }
}

export interface Bus {
  ctx: AudioContext;
  out: GainNode;
  volume: number;
}

/** The master gain every voice of one effect is played through. */
export function createBus(volume: number): Bus | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  const clamped = Math.min(1, Math.max(0, volume));
  const out = ctx.createGain();
  out.gain.setValueAtTime(clamped, ctx.currentTime);
  out.connect(ctx.destination);
  return { ctx, out, volume: clamped };
}

export interface FilterOptions {
  type: BiquadFilterType;
  freq: number;
  /** Sweeps the cutoff towards this frequency over the sound's duration. */
  sweepTo?: number;
  q?: number;
}

export interface VoiceOptions {
  /** Offset from "now", in seconds. */
  start?: number;
  /**
   * An absolute point on the audio clock, for voices queued ahead of time.
   * Takes precedence over `start`: the looping music schedules whole bars into
   * the future, where "now" has moved on by the time they play.
   */
  at?: number;
  duration: number;
  peak?: number;
  attack?: number;
  filter?: FilterOptions;
  /** 0-1 amount sent to the shared reverb. */
  reverb?: number;
  /** Swells in instead of striking, for reverse-cymbal style risers. */
  swell?: boolean;
}

export interface ToneOptions extends VoiceOptions {
  type?: OscillatorType;
  freq: number;
  /** Exponential glide towards this frequency across the duration. */
  slideTo?: number;
  /** The same glide expressed relative to `freq`, for notes of a sequence. */
  slideRatio?: number;
  /** Multi-point pitch ramps as [offset, frequency] pairs, for klaxons. */
  sweep?: [number, number][];
  detune?: number;
  vibrato?: { rate: number; depth: number };
}

export interface NoiseOptions extends VoiceOptions {
  /** Below 1 darkens the grain, above 1 brightens it. */
  rate?: number;
}

function applyFilter(
  bus: Bus,
  source: AudioNode,
  options: FilterOptions | undefined,
  t0: number,
  duration: number,
): AudioNode {
  if (!options) return source;
  const filter = bus.ctx.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.setValueAtTime(options.freq, t0);
  if (options.sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(
      options.sweepTo,
      t0 + duration,
    );
  }
  if (options.q !== undefined) {
    filter.Q.setValueAtTime(options.q, t0);
  }
  source.connect(filter);
  return filter;
}

function envelope(bus: Bus, options: VoiceOptions, t0: number): GainNode {
  const gain = bus.ctx.createGain();
  const peak = options.peak ?? 0.3;
  const attack = options.swell
    ? options.duration * 0.8
    : Math.min(options.attack ?? 0.004, options.duration * 0.5);
  gain.gain.setValueAtTime(SILENCE, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(SILENCE, t0 + options.duration);
  return gain;
}

/** Routes a voice to the dry master and, optionally, to the reverb send. */
function route(bus: Bus, node: AudioNode, reverbAmount = 0): void {
  node.connect(bus.out);
  if (reverbAmount > 0) {
    const convolver = getReverb(bus.ctx);
    if (convolver) {
      const send = bus.ctx.createGain();
      send.gain.setValueAtTime(reverbAmount * bus.volume, bus.ctx.currentTime);
      node.connect(send);
      send.connect(convolver);
    }
  }
}

export function tone(bus: Bus, options: ToneOptions): void {
  const { ctx } = bus;
  const t0 = options.at ?? ctx.currentTime + (options.start ?? 0);
  const end = t0 + options.duration;

  const osc = ctx.createOscillator();
  osc.type = options.type ?? "triangle";
  osc.frequency.setValueAtTime(options.freq, t0);
  const slideTo =
    options.slideTo ??
    (options.slideRatio ? options.freq * options.slideRatio : undefined);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, end);
  }
  options.sweep?.forEach(([offset, freq]) => {
    osc.frequency.linearRampToValueAtTime(freq, t0 + offset);
  });
  if (options.detune !== undefined && osc.detune) {
    osc.detune.setValueAtTime(options.detune, t0);
  }

  if (options.vibrato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(options.vibrato.rate, t0);
    lfoGain.gain.setValueAtTime(options.vibrato.depth, t0);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(end + 0.05);
  }

  const gain = envelope(bus, options, t0);
  const tail = applyFilter(bus, osc, options.filter, t0, options.duration);
  tail.connect(gain);
  route(bus, gain, options.reverb);

  osc.start(t0);
  osc.stop(end + 0.05);
}

export function noise(bus: Bus, options: NoiseOptions): void {
  const { ctx } = bus;
  const buffer = getNoiseBuffer(ctx);
  if (!buffer) return;

  const t0 = options.at ?? ctx.currentTime + (options.start ?? 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (options.rate !== undefined) {
    source.playbackRate.setValueAtTime(options.rate, t0);
  }

  const gain = envelope(bus, options, t0);
  const tail = applyFilter(bus, source, options.filter, t0, options.duration);
  tail.connect(gain);
  route(bus, gain, options.reverb);

  // A random window into the buffer keeps repeated bursts from sounding cloned.
  source.start(t0, Math.random() * 1.5, options.duration + 0.05);
  source.stop(t0 + options.duration + 0.05);
}
