import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleReveal } from "../../src/components/RoleReveal";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("RoleReveal", () => {
  const mockProceedToDrawing = vi.fn();

  const mockStateBase = {
    roomId: "TESTX9",
    myId: "socket-123",
    hostId: "socket-123", // Is Host
    amIImpostor: false,
    secretCategory: "Animals",
    secretWord: "Elephant",
    actions: { proceedToDrawing: mockProceedToDrawing },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial state waiting to be revealed", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<RoleReveal />);

    expect(screen.getByText("role.phase")).toBeInTheDocument();
    expect(screen.getByText("role.title")).toBeInTheDocument();
    expect(screen.getByText("role.press_hold")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /role\.start_drawing/i }),
    ).toBeInTheDocument();
  });

  it("reveals secret word for non-impostors when clicked", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<RoleReveal />);

    // The reveal button is the one containing 'Press and hold to reveal'
    const revealButton = screen
      .getByText("role.press_hold")
      .closest("button");
    expect(revealButton).not.toBeNull();

    // Trigger mouse down to reveal
    fireEvent.mouseDown(revealButton!);

    // Word and category should be visible
    expect(screen.getByText("role.word_is")).toBeInTheDocument();
    expect(screen.getByText("Elephant")).toBeInTheDocument();
    expect(screen.getByText("role.category")).toBeInTheDocument();
  });

  it("reveals impostor status when clicked for impostors", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, amIImpostor: true };
      return selector(state);
    });

    render(<RoleReveal />);

    const revealButton = screen
      .getByText("role.press_hold")
      .closest("button");
    expect(revealButton).not.toBeNull();

    fireEvent.mouseDown(revealButton!);

    // Since our mock Trans returns children if present, and "Inkpostor" is within <span>
    expect(screen.getByText(/Inkpostor/i)).toBeInTheDocument();
    expect(screen.getByText("role.hint")).toBeInTheDocument();
  });

  it("allows the host to start drawing", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<RoleReveal />);

    const startButton = screen.getByRole("button", { name: /role\.start_drawing/i });
    fireEvent.click(startButton);

    expect(mockProceedToDrawing).toHaveBeenCalled();
  });

  it("shows waiting message for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, myId: "socket-456" }; // Not host
      return selector(state);
    });

    render(<RoleReveal />);

    expect(
      screen.queryByRole("button", { name: /role\.start_drawing!/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("role.waiting_host"),
    ).toBeInTheDocument();
  });
});
