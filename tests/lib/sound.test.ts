import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  playSoundEffect,
  resetAudioContextForTesting,
  type SoundEffect,
} from "../../src/lib/sound";

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
    const mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockOscillatorNode = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockAudioContextInstance = {
      currentTime: 0,
      state: "running",
      destination: {},
      createGain: vi.fn(() => ({
        ...mockGainNode,
        gain: { ...mockGainNode.gain },
      })),
      createOscillator: vi.fn(() => ({
        ...mockOscillatorNode,
        frequency: { ...mockOscillatorNode.frequency },
      })),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    function MockAudioContext(this: unknown) {
      return mockAudioContextInstance;
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    const effects: SoundEffect[] = [
      "click",
      "playerJoin",
      "gameStart",
      "roleReveal",
      "roleRevealCrew",
      "roleRevealImpostor",
      "turnAlert",
      "timerTick",
      "emergencyAlert",
      "undo",
      "inkStroke",
      "voteCast",
      "playerEjected",
      "impostorGuessCorrect",
      "impostorGuessWrong",
      "victory",
      "defeat",
      "testSound",
    ];

    effects.forEach((effect) => {
      expect(() => playSoundEffect(effect, 0.7)).not.toThrow();
    });

    expect(mockAudioContextInstance.createGain).toHaveBeenCalled();
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled();
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
