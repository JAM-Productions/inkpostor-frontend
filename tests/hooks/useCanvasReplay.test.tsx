import React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCanvasReplay } from "../../src/hooks/useCanvasReplay";
import { buildAuthorRuns } from "../../src/lib/strokeAuthors";
import type { StrokeData } from "../../src/store/gameState";

/**
 * Guards how the replay paints, not only what it ends up showing.
 *
 * Repainting the whole drawing on every frame is what makes a long one crawl,
 * and it would still produce the right picture — only a test that watches for
 * the clear would notice. The other half is the fit: points carry the pixels of
 * whatever canvas they were drawn on, never the ones of the box they land in.
 */
describe("useCanvasReplay", () => {
  const CONTAINER_WIDTH = 300;
  const CONTAINER_HEIGHT = 200;

  let ctx: any;
  let alphas: number[];
  let clock: number;
  let frames: FrameRequestCallback[];

  const point = (x: number, playerId?: string): StrokeData => ({
    x,
    y: x,
    color: "#000",
    isNewStroke: x === 0,
    ...(playerId ? { playerId } : {}),
  });

  const Harness: React.FC<{
    strokes: StrokeData[];
    isolatedPlayerId: string | null;
    report: (state: {
      status: string;
      currentAuthorId: string | null;
      replay: () => void;
    }) => void;
  }> = ({ strokes, isolatedPlayerId, report }) => {
    const runs = React.useMemo(() => buildAuthorRuns(strokes), [strokes]);
    const replay = useCanvasReplay(strokes, runs, isolatedPlayerId);
    // Reported after the commit, never during the render: React may replay or
    // throw away render work, and this hands a value out of the component.
    React.useEffect(() => {
      report({
        status: replay.status,
        currentAuthorId: replay.currentAuthorId,
        replay: replay.replay,
      });
    });
    return (
      <div ref={replay.containerRef}>
        <canvas ref={replay.canvasRef} />
      </div>
    );
  };

  const renderReplay = (
    strokes: StrokeData[],
    { seed = true }: { seed?: boolean } = {},
  ) => {
    let latest = {
      status: "playing",
      currentAuthorId: null as string | null,
      replay: () => {},
    };
    const view = render(
      <Harness
        strokes={strokes}
        isolatedPlayerId={null}
        report={(state) => {
          latest = state;
        }}
      />,
    );
    // The replay starts its clock on the first frame it gets, so that frame is
    // what sets time zero. Tests that care about the clock itself opt out.
    if (seed) advance(0);

    const rerender = (next: StrokeData[], isolatedPlayerId: string | null) =>
      view.rerender(
        <Harness
          strokes={next}
          isolatedPlayerId={isolatedPlayerId}
          report={(state) => {
            latest = state;
          }}
        />,
      );

    return {
      ...view,
      state: () => latest,
      isolate: (playerId: string | null) => rerender(strokes, playerId),
      /** Hands it another drawing, the way picking a round out of the carousel does. */
      show: (next: StrokeData[]) => rerender(next, null),
    };
  };

  /** Runs the frames that are due after `ms` of animation have gone by. */
  const advance = (ms: number) =>
    act(() => {
      clock += ms;
      const due = frames;
      frames = [];
      due.forEach((frame) => frame(clock));
    });

  beforeEach(() => {
    alphas = [];
    clock = 0;
    frames = [];

    ctx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      lineCap: "",
      lineJoin: "",
      lineWidth: 0,
      strokeStyle: "",
      set globalAlpha(value: number) {
        alphas.push(value);
      },
      get globalAlpha() {
        return 1;
      },
    };

    // jsdom lays nothing out, so the box the drawing has to fit into is stated.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: CONTAINER_WIDTH,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: CONTAINER_HEIGHT,
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as any;

    vi.spyOn(performance, "now").mockImplementation(() => clock);
    vi.stubGlobal("requestAnimationFrame", (frame: FrameRequestCallback) => {
      frames.push(frame);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
    Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  });

  it("paints only what has come due, without clearing what is already there", () => {
    const strokes = [
      point(0, "alice"),
      point(1),
      point(2),
      point(3),
      point(4, "bob"),
      point(5),
    ];
    renderReplay(strokes);
    // The opening clear is the blank sheet, not a repaint.
    ctx.clearRect.mockClear();

    advance(300);
    const painted = ctx.lineTo.mock.calls.length;
    expect(painted).toBeGreaterThan(0);
    expect(painted).toBeLessThan(strokes.length);

    advance(300);

    expect(ctx.lineTo.mock.calls.length).toBeGreaterThan(painted);
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it("counts from the first frame, which may predate being asked for", () => {
    // A frame is handed the time it began, and that can be earlier than the
    // moment the replay was set up. Counted from the wrong origin, the first
    // frames come out negative and run off the front of the drawing.
    clock = 1000;
    const strokes = [point(0, "alice"), point(1), point(2)];
    const { state } = renderReplay(strokes, { seed: false });

    advance(-5);

    expect(ctx.lineTo).not.toHaveBeenCalled();

    advance(2000);

    expect(state().status).toBe("finished");
    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length * 2);
  });

  it("lands on the whole drawing, gone over once in whole paths", () => {
    const strokes = [point(0, "alice"), point(1), point(2, "bob"), point(3)];
    const { state } = renderReplay(strokes);

    advance(5000);

    expect(state().status).toBe("finished");
    // Every point as it was animated, then the finished drawing laid down again
    // in one pass to take the seams between bursts out of it.
    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length * 2);
  });

  it("settles into few paths, however many frames it took to animate", () => {
    // Left as the frames drew it, a line is a row of separately stroked
    // segments whose antialiased ends blend instead of adding up.
    const strokes = Array.from({ length: 40 }, (_, i) =>
      i === 0 ? point(0, "alice") : point(i),
    );
    renderReplay(strokes);

    // Frame by frame, in small bursts, the way it really runs.
    for (let i = 0; i < 20; i++) advance(16);
    ctx.stroke.mockClear();
    advance(5000);

    expect(ctx.stroke.mock.calls.length).toBeLessThan(4);
  });

  it("names whoever is drawing, and stops once there is nobody", () => {
    const strokes = [
      point(0, "alice"),
      point(1),
      point(2, "bob"),
      point(3),
      point(4),
      point(5),
    ];
    const { state } = renderReplay(strokes);

    advance(150);
    expect(state().currentAuthorId).toBe("alice");

    advance(600);
    expect(state().currentAuthorId).toBe("bob");

    advance(5000);
    expect(state().status).toBe("finished");
    expect(state().currentAuthorId).toBeNull();
  });

  it("fits the drawing into the box rather than trusting its coordinates", () => {
    // 100 wide and 100 tall into 300x200 less 16 of padding: the height is what
    // limits it, 168/100, and the 100 left over across is split either side.
    renderReplay([point(0, "alice"), point(100)]);
    advance(5000);

    expect(ctx.lineTo).toHaveBeenCalledWith(66, 16);
    expect(ctx.lineTo).toHaveBeenCalledWith(234, 184);
  });

  it("does not repaint over a replay that has just restarted", () => {
    // Replaying from a singled-out drawing restarts the animation and drops the
    // isolation in the same commit. The effect that handles isolation still sees
    // the status from before the restart, so only a running-or-not flag it can
    // read there and then keeps it off a canvas the loop has already taken over.
    const strokes = [point(0, "alice"), point(1), point(2, "bob"), point(3)];
    const { state, isolate } = renderReplay(strokes);
    advance(5000);
    isolate("bob");
    alphas.length = 0;
    ctx.lineTo.mockClear();

    // Both in one commit, the way the modal does it.
    act(() => {
      state().replay();
      isolate(null);
    });

    // The restart owns the canvas: nothing faded, and only the frames paint.
    expect(alphas.every((alpha) => alpha === 1)).toBe(true);
    expect(ctx.lineTo).not.toHaveBeenCalled();

    advance(0);
    advance(5000);

    expect(state().status).toBe("finished");
    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length * 2);
    expect(alphas.every((alpha) => alpha === 1)).toBe(true);
  });

  it("lays a continuous line down as one path, not as loose segments", () => {
    // Stroking every segment on its own makes the round caps of neighbours
    // overlap, and below full opacity each overlap composites twice: a faded
    // line comes out stippled instead of faint.
    const strokes = [point(0, "alice"), point(1), point(2, "bob"), point(3)];
    const { isolate } = renderReplay(strokes);
    advance(5000);
    ctx.stroke.mockClear();
    ctx.lineTo.mockClear();

    isolate("bob");

    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length);
    // One path for what is held back and one for what is singled out.
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it("frames on the whole drawing when given one, not on what it replays", () => {
    // Replaying one round of a canvas that was never wiped: fitted to itself,
    // the round would be blown up to fill the sheet and lose where it sat.
    const whole = [point(0, "alice"), point(50), point(100)];
    const oneRound = whole.slice(2);
    let latest = { status: "playing", currentAuthorId: null as string | null };
    const Framed: React.FC = () => {
      const runs = React.useMemo(() => buildAuthorRuns(oneRound), []);
      const replay = useCanvasReplay(oneRound, runs, null, whole);
      React.useEffect(() => {
        latest = {
          status: replay.status,
          currentAuthorId: replay.currentAuthorId,
        };
      });
      return (
        <div ref={replay.containerRef}>
          <canvas ref={replay.canvasRef} />
        </div>
      );
    };
    render(<Framed />);
    advance(0);
    advance(5000);

    expect(latest.status).toBe("finished");
    // The same 0..100 frame the whole drawing gets, so this point lands at the
    // far corner rather than being stretched across the sheet on its own.
    expect(ctx.lineTo).toHaveBeenCalledWith(234, 184);
    expect(ctx.lineTo).not.toHaveBeenCalledWith(66, 16);
  });

  it("puts another drawing straight up, without animating it", () => {
    // Picking a round out of the carousel is not asking to watch it drawn: the
    // round it names is simply what is on the sheet from then on.
    const first = [point(0, "alice"), point(1)];
    const second = [point(10, "bob"), point(11), point(12)];
    const { state, show } = renderReplay(first);
    advance(5000);
    ctx.lineTo.mockClear();

    show(second);

    expect(state().status).toBe("finished");
    expect(ctx.lineTo).toHaveBeenCalledTimes(second.length);
    // Nothing left running that a later frame could carry on painting.
    expect(frames).toHaveLength(0);
  });

  it("animates again when asked, whichever drawing it is showing", () => {
    const first = [point(0, "alice"), point(1)];
    const second = [point(10, "bob"), point(11), point(12)];
    const { state, show } = renderReplay(first);
    advance(5000);
    show(second);
    ctx.lineTo.mockClear();

    act(() => state().replay());

    expect(state().status).toBe("playing");
    expect(ctx.lineTo).not.toHaveBeenCalled();

    advance(0);
    advance(5000);

    expect(state().status).toBe("finished");
    expect(ctx.lineTo).toHaveBeenCalledTimes(second.length * 2);
  });

  it("lays what came before down faint, and never animates it", () => {
    // Replaying round two of a canvas that was never wiped: round one is
    // already on the paper when the pen starts moving, the way it really was.
    const earlier = [point(0, "alice"), point(10)];
    const thisRound = [point(20, "bob"), point(30)];
    let latest = { status: "playing" };
    const WithBackdrop: React.FC = () => {
      const runs = React.useMemo(() => buildAuthorRuns(thisRound), []);
      const replay = useCanvasReplay(thisRound, runs, null, thisRound, earlier);
      React.useEffect(() => {
        latest = { status: replay.status };
      });
      return (
        <div ref={replay.containerRef}>
          <canvas ref={replay.canvasRef} />
        </div>
      );
    };
    render(<WithBackdrop />);

    // All of it is there before a single frame has run.
    expect(ctx.lineTo).toHaveBeenCalledTimes(earlier.length);
    expect(alphas.some((alpha) => alpha > 0 && alpha < 1)).toBe(true);

    ctx.lineTo.mockClear();
    advance(0);
    advance(5000);

    expect(latest.status).toBe("finished");
    // Repainted underneath each time the sheet is cleared, never drawn into.
    expect(ctx.lineTo).toHaveBeenCalledTimes(
      thisRound.length + earlier.length + thisRound.length,
    );
  });

  it("holds the others back rather than hiding them when one is singled out", () => {
    const strokes = [point(0, "alice"), point(1), point(2, "bob"), point(3)];
    const { isolate } = renderReplay(strokes);
    advance(5000);
    ctx.lineTo.mockClear();
    ctx.clearRect.mockClear();
    alphas.length = 0;

    isolate("bob");

    // Repainted from scratch, everyone still on the sheet, and the two halves
    // told apart by opacity rather than by one of them going missing.
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length);
    expect(alphas).toContain(1);
    expect(alphas.some((alpha) => alpha > 0 && alpha < 1)).toBe(true);
  });

  it("puts the whole drawing back when nobody is singled out", () => {
    const strokes = [point(0, "alice"), point(1), point(2, "bob"), point(3)];
    const { isolate } = renderReplay(strokes);
    advance(5000);
    isolate("bob");
    ctx.lineTo.mockClear();
    alphas.length = 0;

    isolate(null);

    expect(ctx.lineTo).toHaveBeenCalledTimes(strokes.length);
    expect(alphas.every((alpha) => alpha === 1)).toBe(true);
  });
});
