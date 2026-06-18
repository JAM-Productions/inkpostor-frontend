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
});
