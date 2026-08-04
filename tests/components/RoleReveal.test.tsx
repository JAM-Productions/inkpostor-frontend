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
    players: [
      { id: "socket-123", name: "Player 1", hasRevealedRole: false },
      { id: "socket-456", name: "Player 2", hasRevealedRole: false },
    ],
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

    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Your Secret Role")).toBeInTheDocument();
    expect(screen.getByText("Press and hold to reveal")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals secret word for non-impostors when clicked", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<RoleReveal />);

    // The reveal button is the one containing 'Press and hold to reveal'
    const revealButton = screen
      .getByText("Press and hold to reveal")
      .closest("button");
    expect(revealButton).not.toBeNull();

    // Trigger mouse down to reveal
    fireEvent.mouseDown(revealButton!);

    // Word and category should be visible
    expect(screen.getByText("The word is")).toBeInTheDocument();
    expect(screen.getByText("Elephant")).toBeInTheDocument();
    expect(screen.getByText("Category: Animals")).toBeInTheDocument();
  });

  it("reveals impostor status when clicked for impostors", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase, amIImpostor: true };
      return selector(state);
    });

    render(<RoleReveal />);

    const revealButton = screen
      .getByText("Press and hold to reveal")
      .closest("button");
    expect(revealButton).not.toBeNull();

    fireEvent.mouseDown(revealButton!);

    expect(screen.getByText("Inkpostor")).toBeInTheDocument();
    expect(screen.getByText("Hint: Animals")).toBeInTheDocument();
  });

  it.each(["ORIGINAL", "ORIGINAL_CHAOS"])(
    "does not offer to start drawing in %s",
    (gameMode) => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector({ ...mockStateBase, gameMode }),
      );

      render(<RoleReveal />);

      fireEvent.mouseDown(
        screen.getByText("Press and hold to reveal").closest("button")!,
      );

      // Nothing is drawn in a spoken mode: the button just opens the round
      expect(
        screen.getByRole("button", { name: /^start$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /start drawing/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("tells the impostor there is no hint when the category is withheld", () => {
    // ORIGINAL mode with hideHint on: the server never sends the category
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        amIImpostor: true,
        secretCategory: null,
      }),
    );

    render(<RoleReveal />);

    fireEvent.mouseDown(
      screen.getByText("Press and hold to reveal").closest("button")!,
    );

    expect(screen.getByText("No hint this time")).toBeInTheDocument();
    expect(screen.queryByText(/^Hint:/)).not.toBeInTheDocument();
  });

  it("shows Start Drawing button after revealing and allows starting", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = { ...mockStateBase };
      return selector(state);
    });

    render(<RoleReveal />);

    // Reveal role to show the start button
    const revealButton = screen
      .getByText("Press and hold to reveal")
      .closest("button");
    fireEvent.mouseDown(revealButton!);

    const startButton = screen.getByRole("button", { name: /start drawing/i });
    fireEvent.click(startButton);

    expect(mockProceedToDrawing).toHaveBeenCalled();
  });

  it("hides Start Drawing button after proceedToDrawing is clicked", () => {
    const mockState = {
      ...mockStateBase,
      players: mockStateBase.players.map((player) => ({ ...player })),
    };

    mockState.actions = {
      proceedToDrawing: vi.fn(() => {
        mockState.players = mockState.players.map((player) =>
          player.id === mockState.myId
            ? { ...player, hasRevealedRole: true }
            : player,
        );
      }),
    };

    (useGameStore as any).mockImplementation((selector: any) =>
      selector(mockState),
    );

    const { rerender } = render(<RoleReveal />);

    const revealButton = screen
      .getByText("Press and hold to reveal")
      .closest("button");
    fireEvent.mouseDown(revealButton!);

    const startButton = screen.getByRole("button", { name: /start drawing/i });
    fireEvent.click(startButton);
    rerender(<RoleReveal />);

    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
  });

  it("shows waiting message if player has already revealed role", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        players: [
          { id: "socket-123", name: "Player 1", hasRevealedRole: true },
          { id: "socket-456", name: "Player 2", hasRevealedRole: false },
        ],
      };
      return selector(state);
    });

    render(<RoleReveal />);

    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("1 of 2 players have revealed their role"),
    ).toBeInTheDocument();
  });
});
