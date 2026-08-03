import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DrawingToolbar } from "../../../src/components/canvas/DrawingToolbar";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("DrawingToolbar", () => {
  const mockStateBase = {
    isMobile: false,
    gameOptions: { unlimitedInk: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase, ...overrides }),
    );
  };

  const defaultProps: React.ComponentProps<typeof DrawingToolbar> = {
    color: "#1a1a1a",
    onColorChange: vi.fn(),
    onUndo: vi.fn(),
    inkPercentage: 40,
    isOutOfInk: false,
  };

  const renderToolbar = (
    props: Partial<React.ComponentProps<typeof DrawingToolbar>> = {},
  ) => render(<DrawingToolbar {...defaultProps} {...props} />);

  it("calls onColorChange with the picked color", () => {
    mockStore();
    const onColorChange = vi.fn();
    renderToolbar({ onColorChange });

    fireEvent.click(screen.getByLabelText("Green"));

    expect(onColorChange).toHaveBeenCalledWith("#22c55e");
  });

  it("calls onUndo when clicking the undo button", () => {
    mockStore();
    const onUndo = vi.fn();
    renderToolbar({ onUndo });

    fireEvent.click(screen.getByLabelText("Undo last stroke"));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("toggles between compressed and expanded modes", () => {
    mockStore();
    renderToolbar();

    expect(screen.getByLabelText("Compress toolbar")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Compress toolbar"));

    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Expand toolbar")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Expand toolbar"));
    expect(screen.getByLabelText("Compress toolbar")).toBeInTheDocument();
  });

  it("shows the remaining ink percentage", () => {
    mockStore();
    renderToolbar({ inkPercentage: 40, isOutOfInk: false });

    // 100 - 40 = 60% remaining
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("shows OUT OF INK in the meter when out of ink", () => {
    mockStore();
    renderToolbar({ inkPercentage: 100, isOutOfInk: true });

    expect(screen.getByText("OUT OF INK!")).toBeInTheDocument();
  });

  it("hides the ink meter and compress button with unlimited ink", () => {
    mockStore({ gameOptions: { unlimitedInk: true } });
    renderToolbar();

    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
  });

  it("keeps only undo and the ink meter with player colors on", () => {
    mockStore({
      gameOptions: { unlimitedInk: false, playerColorsEnabled: true },
    });
    renderToolbar();

    expect(screen.queryByLabelText("Green")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.getByText("Ink Supply")).toBeInTheDocument();
  });

  it("keeps only undo with player colors on and unlimited ink, and labels it", () => {
    mockStore({
      gameOptions: { unlimitedInk: true, playerColorsEnabled: true },
    });
    renderToolbar();

    expect(screen.queryByLabelText("Green")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Compress toolbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Ink Supply")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    // Alone in the toolbar, the icon is not enough on its own
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("leaves the undo button icon-only whenever something else is shown", () => {
    mockStore({
      gameOptions: { unlimitedInk: false, playerColorsEnabled: true },
    });
    const { unmount } = renderToolbar();

    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.queryByText("Undo")).not.toBeInTheDocument();
    unmount();

    mockStore({ gameOptions: { unlimitedInk: true } });
    renderToolbar();

    expect(screen.getByLabelText("Undo last stroke")).toBeInTheDocument();
    expect(screen.queryByText("Undo")).not.toBeInTheDocument();
  });

  it("still calls onUndo when the palette is hidden", () => {
    mockStore({
      gameOptions: { unlimitedInk: true, playerColorsEnabled: true },
    });
    const onUndo = vi.fn();
    renderToolbar({ onUndo });

    fireEvent.click(screen.getByLabelText("Undo last stroke"));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
