import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  enableAudioSessionPlayback,
  getCurrentMusicTrack,
  initAudioListeners,
  playSoundEffect,
  resetAudioContextForTesting,
  resetMusicForTesting,
  resumeAudioContext,
  setMusicTrack,
  setMusicVolume,
  SOUND_EFFECTS,
  unlockAudio,
} from "../../src/lib/sound";

function createAudioParam() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    cancelAndHoldAtTime: vi.fn(),
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

  describe("resuming and unlocking audio on iOS / Safari", () => {
    it("configures navigator.audioSession.type to playback", () => {
      const mockAudioSession = { type: "ambient" };
      Object.defineProperty(navigator, "audioSession", {
        value: mockAudioSession,
        configurable: true,
        writable: true,
      });

      enableAudioSessionPlayback();
      expect(mockAudioSession.type).toBe("playback");
    });

    it("handles errors when setting navigator.audioSession gracefully", () => {
      Object.defineProperty(navigator, "audioSession", {
        get() {
          throw new Error("SecurityError");
        },
        configurable: true,
      });

      expect(() => enableAudioSessionPlayback()).not.toThrow();
    });

    it("resumes AudioContext when in suspended state", async () => {
      const mockResume = vi.fn().mockResolvedValue(undefined);
      const mockCtx = {
        state: "suspended",
        resume: mockResume,
      } as unknown as AudioContext;

      await resumeAudioContext(mockCtx);
      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("resumes AudioContext when in interrupted state (iOS WebKit)", async () => {
      const mockResume = vi.fn().mockResolvedValue(undefined);
      const mockCtx = {
        state: "interrupted",
        resume: mockResume,
      } as unknown as AudioContext;

      await resumeAudioContext(mockCtx);
      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it("does not call resume when AudioContext is already running", async () => {
      const mockResume = vi.fn().mockResolvedValue(undefined);
      const mockCtx = {
        state: "running",
        resume: mockResume,
      } as unknown as AudioContext;

      await resumeAudioContext(mockCtx);
      expect(mockResume).not.toHaveBeenCalled();
    });

    it("unlocks audio by resuming context, playing silent buffer, and playing HTMLAudioElement", () => {
      const mockAudioContextInstance = createMockAudioContext();
      mockAudioContextInstance.state = "suspended";
      function MockAudioContext(this: unknown) {
        return mockAudioContextInstance;
      }
      window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tag: string) => {
          if (tag === "audio") {
            return {
              setAttribute: vi.fn(),
              play: mockPlay,
              preload: "",
              src: "",
            } as unknown as HTMLAudioElement;
          }
          return originalCreateElement(tag);
        });

      unlockAudio();

      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createBufferSource).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalled();

      // Subsequent unlock calls should be idempotent for HTMLAudioElement
      mockPlay.mockClear();
      unlockAudio();
      expect(mockPlay).not.toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it("initAudioListeners registers capture listeners and cleans up properly", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const docAddSpy = vi.spyOn(document, "addEventListener");
      const docRemoveSpy = vi.spyOn(document, "removeEventListener");

      const cleanup = initAudioListeners();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        {
          capture: true,
          passive: true,
        },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
        {
          capture: true,
          passive: true,
        },
      );
      expect(docAddSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        {
          capture: true,
        },
      );
      expect(docRemoveSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });
  });

  describe("bus cleanup and node lifecycle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("disconnects the bus output gain after effect finishes", () => {
      const mockAudioContextInstance = createMockAudioContext();
      const mockGainDisconnect = vi.fn();
      mockAudioContextInstance.createGain = vi.fn(() => ({
        gain: createAudioParam(),
        connect: vi.fn(),
        disconnect: mockGainDisconnect,
      }));
      function MockAudioContext(this: unknown) {
        return mockAudioContextInstance;
      }
      window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

      playSoundEffect("click", 0.7);

      expect(mockGainDisconnect).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(mockGainDisconnect).toHaveBeenCalled();
    });
  });

  describe("music scheduler handling", () => {
    beforeEach(() => {
      resetMusicForTesting();
    });

    afterEach(() => {
      resetMusicForTesting();
    });

    it("handles track transitions and safe volume ramping", () => {
      const mockAudioContextInstance = createMockAudioContext();
      function MockAudioContext(this: unknown) {
        return mockAudioContextInstance;
      }
      window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

      setMusicTrack("lobby", 0.5);
      expect(getCurrentMusicTrack()).toBe("lobby");

      setMusicVolume(0.8);
      expect(getCurrentMusicTrack()).toBe("lobby");

      setMusicTrack(null, 0);
      expect(getCurrentMusicTrack()).toBeNull();
    });

    it("initializes volume directly when audio context is suspended", () => {
      const mockAudioContextInstance = createMockAudioContext();
      mockAudioContextInstance.state = "suspended";
      const mockGainParam = createAudioParam();
      mockAudioContextInstance.createGain = vi.fn(() => ({
        gain: mockGainParam,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }));
      function MockAudioContext(this: unknown) {
        return mockAudioContextInstance;
      }
      window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

      setMusicTrack("lobby", 0.5);

      expect(mockGainParam.setValueAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        mockAudioContextInstance.currentTime,
      );
      expect(mockGainParam.linearRampToValueAtTime).not.toHaveBeenCalled();
    });
  });
});
