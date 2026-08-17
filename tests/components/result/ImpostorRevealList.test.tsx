import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImpostorRevealList } from "../../../src/components/result/ImpostorRevealList";
import { useGameStore, type Player } from "../../../src/store/gameState";

vi.mock("../../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("ImpostorRevealList", () => {
  const createPlayer = (id: string, name: string): Player => ({
    id,
    name,
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
  });

  const players = [
    createPlayer("host-1", "Host"),
    createPlayer("p2", "Bob"),
    createPlayer("p3", "Charlie"),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: { players: Player[] }) => unknown) =>
        selector({ players }),
    );
  });

  it("deals one card per impostor, in the order it is given them", () => {
    render(<ImpostorRevealList impostors={players.slice(1)} hostId="host-1" />);

    const cards = screen.getAllByTestId("impostor-result-card");
    expect(cards.map((card) => card.textContent)).toEqual([
      "BBobINKPOSTOR",
      "CCharlieINKPOSTOR",
    ]);
  });

  it("tells each card how many of them there are, so the odd one can centre", () => {
    render(<ImpostorRevealList impostors={[players[1]]} hostId="host-1" />);

    // A lone card is the odd one out: it keeps a column's width, centred
    expect(screen.getByTestId("impostor-result-card")).toHaveClass(
      "sm:col-span-2",
      "sm:justify-self-center",
    );
  });

  it("takes the full width it is given, whatever lays it out", () => {
    // It also sits inside a centring flex row, which would otherwise shrink it
    render(<ImpostorRevealList impostors={players.slice(1)} hostId="host-1" />);

    expect(screen.getByTestId("impostor-reveal-list")).toHaveClass("w-full");
  });
});
