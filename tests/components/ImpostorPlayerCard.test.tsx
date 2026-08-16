import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImpostorPlayerCard } from "../../src/components/ImpostorPlayerCard";
import { useGameStore, type Player } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ImpostorPlayerCard", () => {
  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: "player-2",
    name: "Bob",
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
    ...overrides,
  });

  const players = [
    createPlayer({ id: "host-1", name: "Host" }),
    createPlayer(),
    createPlayer({ id: "player-3", name: "Charlie" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { players: Player[] }) => unknown) =>
        selector({ players }),
    );
  });

  it("names the player and stamps them as the impostor", () => {
    render(<ImpostorPlayerCard player={createPlayer()} hostId="host-1" />);

    const card = screen.getByTestId("impostor-result-card");
    expect(card).toHaveTextContent("Bob");
    expect(card).toHaveTextContent("INKPOSTOR");
    // The avatar carries the initial, like every other player card
    expect(card.firstElementChild).toHaveTextContent("B");
  });

  it("tints the avatar with that player's own colour", () => {
    render(<ImpostorPlayerCard player={createPlayer()} hostId="host-1" />);

    // Bob is the second player, so he gets the second palette entry
    expect(
      screen.getByTestId("impostor-result-card").firstElementChild,
    ).toHaveClass("bg-emerald-500");
  });

  it("centres itself across both columns when the list leaves it alone", () => {
    // Third of three: the two columns don't pair up for it
    render(
      <ImpostorPlayerCard
        player={createPlayer()}
        hostId="host-1"
        index={2}
        total={3}
      />,
    );

    expect(screen.getByTestId("impostor-result-card")).toHaveClass(
      "sm:col-span-2",
      "sm:justify-self-center",
    );
  });

  it("stays in its own column when it has a partner", () => {
    render(
      <ImpostorPlayerCard
        player={createPlayer()}
        hostId="host-1"
        index={0}
        total={2}
      />,
    );

    expect(screen.getByTestId("impostor-result-card")).not.toHaveClass(
      "sm:col-span-2",
    );
  });

  it("deals the cards one after another", () => {
    render(
      <>
        <ImpostorPlayerCard player={createPlayer()} hostId="host-1" index={0} />
        <ImpostorPlayerCard
          player={createPlayer({ id: "player-3", name: "Charlie" })}
          hostId="host-1"
          index={1}
        />
      </>,
    );

    const cards = screen.getAllByTestId(
      "impostor-result-card",
    ) as HTMLElement[];
    expect(cards.map((card) => card.style.animationDelay)).toEqual([
      "0ms",
      "150ms",
    ]);
  });
});
