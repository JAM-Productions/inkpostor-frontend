import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  playSoundEffect,
  resetAudioContextForTesting,
  SOUND_EFFECTS,
} from "../../src/lib/sound";

function createAudioParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
}

/**
 * Stands in for the whole Web Audio surface the sound library touches:
 * oscillators, gains, filters, noise buffer sources and the reverb convolver.
 */
function createMockAudioContext() {
  return {
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    destination: {},
    createGain: vi.fn(() => ({ gain: createAudioParam(), connect: vi.fn() })),
    createOscillator: vi.fn(() => ({
      type: "sine",
      frequency: createAudioParam(),
      detune: createAudioParam(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: "lowpass",
      frequency: createAudioParam(),
      Q: createAudioParam(),
      connect: vi.fn(),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      playbackRate: createAudioParam(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn((channels: number, length: number) => ({
      getChannelData: vi.fn(() => new Float32Array(length)),
      numberOfChannels: channels,
    })),
    createConvolver: vi.fn(() => ({ buffer: null, connect: vi.fn() })),
    resume: vi.fn().mockResolvedValue(undefined),
  };
}

describe("sound library", () => {
  const originalAudioContext = window.AudioContext;

  beforeEach(() => {
    vi.clearAllMocks();
    resetAudioContextForTesting();
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
  });

  it("does nothing if volume is 0 or negative", () => {
    const mockCtx = vi.fn();
    window.AudioContext = mockCtx as unknown as typeof AudioContext;

    playSoundEffect("click", 0);
    playSoundEffect("click", -0.5);

    expect(mockCtx).not.toHaveBeenCalled();
  });

  it("handles absence of AudioContext gracefully", () => {
    // @ts-expect-error test absence of AudioContext
    delete window.AudioContext;
    // @ts-expect-error test absence of webkitAudioContext
    delete window.webkitAudioContext;

    expect(() => playSoundEffect("click", 0.7)).not.toThrow();
  });

  it("plays every defined sound effect without error when Web Audio API is available", () => {
    const mockAudioContextInstance = createMockAudioContext();

    function MockAudioContext(this: unknown) {
      return mockAudioContextInstance;
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    // Straight from the catalogue, so an effect added later cannot slip past
    // this without a test.
    expect(SOUND_EFFECTS.length).toBeGreaterThan(20);
    SOUND_EFFECTS.forEach((effect) => {
      expect(() => playSoundEffect(effect, 0.7)).not.toThrow();
    });

    expect(mockAudioContextInstance.createGain).toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
  });

  it("builds the noise and reverb nodes the textured effects rely on", () => {
    const mockAudioContextInstance = createMockAudioContext();

    function MockAudioContext(this: unknown) {
      return mockAudioContextInstance;
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    // inkStroke is filtered noise; roleReveal additionally uses the reverb send.
    playSoundEffect("inkStroke", 0.7);
    expect(mockAudioContextInstance.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContextInstance.createBiquadFilter).toHaveBeenCalled();

    playSoundEffect("roleReveal", 0.7);
    expect(mockAudioContextInstance.createConvolver).toHaveBeenCalled();
  });

  it("reuses the generated noise and reverb buffers across calls", () => {
    const mockAudioContextInstance = createMockAudioContext();

    function MockAudioContext(this: unknown) {
      return mockAudioContextInstance;
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    playSoundEffect("roleReveal", 0.7);
    const buffersAfterFirst =
      mockAudioContextInstance.createBuffer.mock.calls.length;
    playSoundEffect("roleReveal", 0.7);

    // One noise buffer plus one impulse response, generated once and cached.
    expect(buffersAfterFirst).toBe(2);
    expect(mockAudioContextInstance.createBuffer).toHaveBeenCalledTimes(2);
    expect(mockAudioContextInstance.createConvolver).toHaveBeenCalledTimes(1);
  });

  it("resumes suspended AudioContext", () => {
    const mockResume = vi.fn().mockResolvedValue(undefined);
    const mockAudioContextInstance = {
      currentTime: 0,
      state: "suspended",
      destination: {},
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      })),
      createOscillator: vi.fn(() => ({
        type: "sine",
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      resume: mockResume,
    };

    function MockAudioContext(this: unknown) {
      return mockAudioContextInstance;
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    playSoundEffect("click", 0.7);
    expect(mockResume).toHaveBeenCalled();
  });
});
