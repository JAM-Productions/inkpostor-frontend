import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useImpostorCountClamp } from "../../src/hooks/useImpostorCountClamp";
import { useGameStore } from "../../src/store/gameState";
import { DEFAULT_GAME_OPTIONS } from "../../src/lib/constants";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

const TestRoom = () => {
  useImpostorCountClamp();
  return null;
};

describe("useImpostorCountClamp", () => {
  const mockUpdateGameOptions = vi.fn();

  const makePlayers = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`,
    }));

  // A room the host set up for five players: two impostors, and they know who
  // each other are.
  const mockRoom = ({
    playerCount = 4,
    impostorCount = 2,
    ...overrides
  }: Record<string, any> = {}) => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        phase: "LOBBY",
        players: makePlayers(playerCount),
        gameMode: "CLASSIC",
        myId: "player-1",
        hostId: "player-1",
        hostGameOptions: {
          ...DEFAULT_GAME_OPTIONS,
          impostorCount,
          revealImpostorTeammates: true,
        },
        actions: { updateGameOptions: mockUpdateGameOptions },
        ...overrides,
      }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cuts the count the leaving player took out of range", () => {
    mockRoom({ playerCount: 4, impostorCount: 2 });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).toHaveBeenCalledTimes(1);
    expect(mockUpdateGameOptions).toHaveBeenCalledWith({
      ...DEFAULT_GAME_OPTIONS,
      gameMode: "CLASSIC",
      impostorCount: 1,
      // Nothing to reveal to a lone impostor
      revealImpostorTeammates: DEFAULT_GAME_OPTIONS.revealImpostorTeammates,
    });
  });

  it("keeps the teammate reveal when more than one impostor survives the cut", () => {
    // Three were picked for seven players, and there are five left
    mockRoom({ playerCount: 5, impostorCount: 3 });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        impostorCount: 2,
        revealImpostorTeammates: true,
      }),
    );
  });

  it("leaves a count the room still allows alone", () => {
    mockRoom({ playerCount: 7, impostorCount: 2 });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
  });

  it("does not raise a count below the maximum", () => {
    mockRoom({ playerCount: 7, impostorCount: 1 });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
  });

  it("stays quiet for a guest, who cannot change the room's options", () => {
    mockRoom({ playerCount: 4, impostorCount: 2, myId: "player-2" });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
  });

  it("stays quiet once the game has started, when options are no longer editable", () => {
    mockRoom({ playerCount: 4, impostorCount: 2, phase: "DRAWING" });

    render(<TestRoom />);

    expect(mockUpdateGameOptions).not.toHaveBeenCalled();
  });

  it("corrects a departure only once", () => {
    mockRoom({ playerCount: 5, impostorCount: 2 });
    const { rerender } = render(<TestRoom />);
    expect(mockUpdateGameOptions).not.toHaveBeenCalled();

    // One of the five leaves
    mockRoom({ playerCount: 4, impostorCount: 2 });
    rerender(<TestRoom />);
    expect(mockUpdateGameOptions).toHaveBeenCalledTimes(1);

    // The correction lands, and the room settles on it
    mockRoom({ playerCount: 4, impostorCount: 1 });
    rerender(<TestRoom />);
    expect(mockUpdateGameOptions).toHaveBeenCalledTimes(1);
  });
});
