import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LobbyPlayerCard } from "../../src/components/LobbyPlayerCard";
import { useGameStore, type Player } from "../../src/store/gameState";

vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("LobbyPlayerCard", () => {
  const mockKickPlayer = vi.fn();

  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: "player-1",
    name: "Alice",
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
    ...overrides,
  });

  const renderCard = ({
    player = createPlayer(),
    hostId = "host-1",
    myId = "host-1",
    isHost = true,
  }: {
    player?: Player;
    hostId?: string | null;
    players?: Player[];
    myId?: string | null;
    isHost?: boolean;
  } = {}) =>
    render(
      <LobbyPlayerCard
        player={player}
        hostId={hostId}
        myId={myId}
        isHost={isHost}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (
        selector: (state: {
          actions: { kickPlayer: typeof mockKickPlayer };
          players: Player[];
        }) => unknown,
      ) =>
        selector({
          actions: { kickPlayer: mockKickPlayer },
          players: [
            createPlayer({ id: "host-1", name: "Host" }),
            createPlayer({ id: "player-2", name: "Bob" }),
          ],
        }),
    );
  });

  it("renders the host badge and hides the kick action for the host player", () => {
    const hostPlayer = createPlayer({ id: "host-1", name: "Host" });

    renderCard({
      player: hostPlayer,
      hostId: "host-1",
      players: [hostPlayer, createPlayer({ id: "player-2", name: "Bob" })],
    });

    expect(screen.getAllByText("Host")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /kick host/i }),
    ).not.toBeInTheDocument();
  });

  it("highlights the current player card", () => {
    const player = createPlayer({ id: "player-1", name: "Alice" });
    const { container } = renderCard({
      player,
      myId: "player-1",
      players: [createPlayer({ id: "host-1", name: "Host" }), player],
    });

    expect(container.firstElementChild).toHaveClass("bg-white/20");
    expect(container.firstElementChild).toHaveClass("border-white/40");
  });

  it("does not show kick controls for non-host viewers", () => {
    renderCard({
      isHost: false,
      myId: "player-2",
    });

    expect(
      screen.queryByRole("button", { name: /kick alice/i }),
    ).not.toBeInTheDocument();
  });

  it("shows confirm and cancel actions when the host starts a kick, and cancel resets the flow", async () => {
    const user = userEvent.setup();

    renderCard();

    await user.click(screen.getByRole("button", { name: /kick alice/i }));

    expect(
      screen.getByRole("button", { name: /confirm kick alice/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel kick alice/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /cancel kick alice/i }),
    );

    expect(
      screen.getByRole("button", { name: /kick alice/i }),
    ).toBeInTheDocument();
    expect(mockKickPlayer).not.toHaveBeenCalled();
  });

  it("kicks the selected player when the host confirms", async () => {
    const user = userEvent.setup();

    renderCard();

    await user.click(screen.getByRole("button", { name: /kick alice/i }));
    await user.click(
      screen.getByRole("button", { name: /confirm kick alice/i }),
    );

    expect(mockKickPlayer).toHaveBeenCalledWith("player-1");
    expect(
      screen.getByRole("button", { name: /kick alice/i }),
    ).toBeInTheDocument();
  });

  it("shows the player initial and no disconnected icon when connected", () => {
    renderCard({
      player: createPlayer({
        id: "player-1",
        name: "Alice",
        isConnected: true,
      }),
    });

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/alice is disconnected/i),
    ).not.toBeInTheDocument();
  });

  it("hides the initial and shows the disconnected icon when not connected", () => {
    renderCard({
      player: createPlayer({
        id: "player-1",
        name: "Alice",
        isConnected: false,
      }),
    });

    // The initial letter is replaced by the loader spinner.
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/alice is disconnected/i)).toBeInTheDocument();
  });
});
