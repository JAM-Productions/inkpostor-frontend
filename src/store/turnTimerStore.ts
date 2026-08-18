import { create } from "zustand";

interface TurnTimerState {
  /** Remaining time of the current drawing turn, in milliseconds. */
  timeLeftMs: number;
  setTimeLeftMs: (ms: number) => void;
}

/**
 * The drawing countdown, deliberately kept out of the component tree.
 *
 * It ticks ten times a second. While it lived in `Canvas` and travelled down as
 * a prop, every tick re-rendered the whole drawing screen — header, canvas,
 * toolbar and popovers — whether or not anyone was drawing. Here only the nodes
 * that actually print the number subscribe to it (see {@link TurnCountdown}).
 */
export const useTurnTimerStore = create<TurnTimerState>()((set) => ({
  timeLeftMs: 0,
  setTimeLeftMs: (ms) => set({ timeLeftMs: ms }),
}));
