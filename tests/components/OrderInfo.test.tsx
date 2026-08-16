import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderInfo } from "../../src/components/OrderInfo";
import { useGameStore } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("OrderInfo", () => {
  const mockConfirmOrder = vi.fn();
  const mockRevealResults = vi.fn();

  const createState = (overrides: Record<string, unknown> = {}) => ({
    myId: "player-1",
    hostId: "player-1",
    currentRound: 2,
    turnOrder: ["player-2", "player-1", "player-3"],
    players: [
      { id: "player-1", name: "Alice", hasConfirmedOrder: false },
      { id: "player-2", name: "Bob", hasConfirmedOrder: false },
      { id: "player-3", name: "Charlie", hasConfirmedOrder: false },
    ],
    actions: {
      confirmOrder: mockConfirmOrder,
      revealResults: mockRevealResults,
    },
    ...overrides,
    // Merged rather than replaced: most of these cases are about the order, and
    // the confirmation gate they exercise only exists with the voting on.
    gameOptions: {
      turnOrderMode: "RANDOM_STARTER",
      virtualVotingEnabled: true,
      ...((overrides.gameOptions as Record<string, unknown>) ?? {}),
    },
  });

  const mockStore = (overrides: Record<string, unknown> = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector(createState(overrides)),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only the starting player as a card in RANDOM_STARTER", () => {
    mockStore();

    render(<OrderInfo />);

    expect(screen.getByText("Round 2")).toBeInTheDocument();
    expect(screen.getByText("Who Starts")).toBeInTheDocument();
    expect(screen.getByTestId("starting-player")).toHaveTextContent("Bob");
    expect(
      screen.getByText("You decide the rest of the order"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("turn-order-list")).not.toBeInTheDocument();
  });

  it.each(["FIXED_ORDER", "RANDOM_ORDER"])(
    "lists the whole order as cards in %s",
    (turnOrderMode) => {
      mockStore({ gameOptions: { turnOrderMode } });

      render(<OrderInfo />);

      const cards = screen.getByTestId("turn-order-list").children;
      expect([...cards].map((card) => card.textContent)).toEqual([
        "1BBob",
        "2AAlice",
        "3CCharlie",
      ]);
      expect(
        screen.getByText("Say your word in this order"),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("starting-player")).not.toBeInTheDocument();
    },
  );

  it("tints the starter card with that player's own colour", () => {
    // Same helper the canvas header uses for whoever is drawing
    mockStore();

    render(<OrderInfo />);

    // Bob is the second player, so he gets the second palette entry
    expect(screen.getByTestId("starting-player").firstElementChild).toHaveClass(
      "bg-emerald-500/20",
    );
  });

  it("reveals the order one row at a time", () => {
    mockStore({ gameOptions: { turnOrderMode: "FIXED_ORDER" } });

    render(<OrderInfo />);

    const rows = [
      ...screen.getByTestId("turn-order-list").children,
    ] as HTMLElement[];
    expect(rows.map((row) => row.style.animationDelay)).toEqual([
      "0ms",
      "100ms",
      "200ms",
    ]);
  });

  it("highlights your own row in the list, like the lobby does", () => {
    mockStore({ gameOptions: { turnOrderMode: "FIXED_ORDER" } });

    render(<OrderInfo />);

    const [bob, alice, charlie] = [
      ...screen.getByTestId("turn-order-list").children,
    ];
    // myId is player-1 (Alice)
    expect(alice).toHaveClass("bg-white/20");
    expect(alice).toHaveClass("border-white/40");
    [bob, charlie].forEach((row) => expect(row).toHaveClass("bg-stone-900"));
  });

  it("confirms the order and switches to the waiting state", async () => {
    const user = userEvent.setup();
    mockStore();

    const { rerender } = render(<OrderInfo />);
    await user.click(screen.getByRole("button", { name: /start voting/i }));
    expect(mockConfirmOrder).toHaveBeenCalledTimes(1);

    mockStore({
      players: [
        { id: "player-1", name: "Alice", hasConfirmedOrder: true },
        { id: "player-2", name: "Bob", hasConfirmedOrder: false },
        { id: "player-3", name: "Charlie", hasConfirmedOrder: false },
      ],
    });
    rerender(<OrderInfo />);

    expect(
      screen.queryByRole("button", { name: /start voting/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3 players are ready")).toBeInTheDocument();
  });

  it("skips ejected players for the starter, the list and the counter", () => {
    mockStore({
      gameOptions: { turnOrderMode: "FIXED_ORDER" },
      players: [
        { id: "player-1", name: "Alice", hasConfirmedOrder: true },
        { id: "player-2", name: "Bob", isEjected: true },
        { id: "player-3", name: "Charlie", hasConfirmedOrder: false },
      ],
    });

    render(<OrderInfo />);

    // Bob opened the order but is out, so the next in line starts
    const cards = screen.getByTestId("turn-order-list").children;
    expect([...cards].map((card) => card.textContent)).toEqual([
      "1AAlice",
      "2CCharlie",
    ]);
    expect(screen.getByText("1 of 2 players are ready")).toBeInTheDocument();
  });

  it("lets the host reveal the results when the voting is not played in the app", async () => {
    const user = userEvent.setup();
    mockStore({ gameOptions: { virtualVotingEnabled: false } });

    render(<OrderInfo />);

    // Nothing to confirm and no round counter: the game ends on this screen
    expect(
      screen.queryByRole("button", { name: /start voting/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Round 2")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("reveal-results-btn"));
    expect(mockRevealResults).toHaveBeenCalledTimes(1);
  });

  it("makes everyone else wait for the host to reveal the results", () => {
    mockStore({
      hostId: "player-2",
      gameOptions: { virtualVotingEnabled: false },
    });

    render(<OrderInfo />);

    expect(screen.queryByTestId("reveal-results-btn")).not.toBeInTheDocument();
    expect(
      screen.getByText("Waiting for host to reveal the results..."),
    ).toBeInTheDocument();
  });

  it("shows an ejected player the waiting message instead of the button", () => {
    mockStore({
      players: [
        { id: "player-1", name: "Alice", isEjected: true },
        { id: "player-2", name: "Bob", hasConfirmedOrder: true },
        { id: "player-3", name: "Charlie", hasConfirmedOrder: false },
      ],
    });

    render(<OrderInfo />);

    expect(
      screen.queryByRole("button", { name: /start voting/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 players are ready")).toBeInTheDocument();
  });
});
