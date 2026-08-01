import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WordReveal } from "../../src/components/WordReveal";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("WordReveal", () => {
  const mockConfirmNewWord = vi.fn();

  const createState = (overrides = {}) => ({
    myId: "player-1",
    amIImpostor: false,
    secretWord: "Volcano",
    secretCategory: "Nature",
    currentRound: 3,
    players: [
      { id: "player-1", name: "Alice", hasRevealedNewWord: false },
      { id: "player-2", name: "Bob", hasRevealedNewWord: false },
      { id: "player-3", name: "Charlie", hasRevealedNewWord: false },
    ],
    actions: { confirmNewWord: mockConfirmNewWord },
    ...overrides,
  });

  const mockStore = (overrides = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState(overrides)),
    );
  };

  const revealCard = () =>
    fireEvent.mouseDown(
      screen.getByText("Press and hold to reveal").closest("button")!,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the round and keeps the word hidden until held", () => {
    mockStore();

    render(<WordReveal />);

    expect(screen.getByText("Round 3")).toBeInTheDocument();
    expect(screen.getByText("New Word")).toBeInTheDocument();
    expect(screen.queryByText("Volcano")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals the new word and its category to a crewmate", () => {
    mockStore();

    render(<WordReveal />);
    revealCard();

    expect(screen.getByText("The new word is")).toBeInTheDocument();
    expect(screen.getByText("Volcano")).toBeInTheDocument();
    expect(screen.getByText("Category: Nature")).toBeInTheDocument();
  });

  it("reveals only the category to the impostor", () => {
    mockStore({ amIImpostor: true, secretWord: null });

    render(<WordReveal />);
    revealCard();

    expect(screen.getByText("Hint: Nature")).toBeInTheDocument();
    expect(
      screen.getByText("You still don't get the word"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Volcano")).not.toBeInTheDocument();
    expect(screen.queryByText("The new word is")).not.toBeInTheDocument();
  });

  it("confirms the word and switches to the waiting state", () => {
    mockStore();

    render(<WordReveal />);
    revealCard();
    fireEvent.click(screen.getByRole("button", { name: /start drawing/i }));

    expect(mockConfirmNewWord).toHaveBeenCalled();
  });

  it("does not count ejected players in the waiting message", () => {
    mockStore({
      players: [
        { id: "player-1", name: "Alice", hasRevealedNewWord: true },
        { id: "player-2", name: "Bob", hasRevealedNewWord: false },
        // Ejected players may watch, but nobody waits for them
        { id: "player-3", name: "Charlie", isEjected: true },
      ],
    });

    render(<WordReveal />);

    expect(
      screen.getByText("1 of 2 players have seen the new word"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an ejected player the waiting message instead of the button", () => {
    mockStore({
      players: [
        { id: "player-1", name: "Alice", isEjected: true },
        { id: "player-2", name: "Bob", hasRevealedNewWord: true },
        { id: "player-3", name: "Charlie", hasRevealedNewWord: false },
      ],
    });

    render(<WordReveal />);

    // Straight to the waiting state, without having to reveal anything first
    expect(
      screen.getByText("1 of 2 players have seen the new word"),
    ).toBeInTheDocument();

    // ...and they can still peek at the word, but never get to confirm it
    revealCard();
    expect(screen.getByText("Volcano")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start drawing/i }),
    ).not.toBeInTheDocument();
    expect(mockConfirmNewWord).not.toHaveBeenCalled();
  });
});
