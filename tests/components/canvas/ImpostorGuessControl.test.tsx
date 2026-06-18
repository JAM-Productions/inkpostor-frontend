import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImpostorGuessControl } from "../../../src/components/canvas/ImpostorGuessControl";
import { useGameStore } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ImpostorGuessControl", () => {
  const mockStateBase = {
    myId: "socket-456",
    currentTurnPlayerId: "socket-123", // not my turn
    gameOptions: { impostorGuessEnabled: true, impostorGuessAttempts: 3 },
    amIImpostor: true,
    impostorGuessesUsed: 0,
    actions: { submitImpostorGuess: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({ ...mockStateBase, ...overrides }),
    );
  };

  it("renders the guess button when the impostor can guess and it is not their turn", () => {
    mockStore();
    render(<ImpostorGuessControl />);
    expect(
      screen.getByRole("button", { name: /guess word/i }),
    ).toBeInTheDocument();
  });

  it("does not render when the player is not the impostor", () => {
    mockStore({ amIImpostor: false });
    const { container } = render(<ImpostorGuessControl />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render on the player's own turn", () => {
    mockStore({ myId: "socket-123" }); // currentTurnPlayerId === myId
    const { container } = render(<ImpostorGuessControl />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when there are no attempts left", () => {
    mockStore({ impostorGuessesUsed: 3 }); // attemptsLeft = 0
    const { container } = render(<ImpostorGuessControl />);
    expect(container.firstChild).toBeNull();
  });

  it("opens the guess form and closes it when clicking outside", () => {
    mockStore();
    render(<ImpostorGuessControl />);

    fireEvent.click(screen.getByRole("button", { name: /guess word/i }));

    expect(screen.getByText("Guess the secret word")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type the secret word..."),
    ).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Guess the secret word")).not.toBeInTheDocument();
  });
});
