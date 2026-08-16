import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameResult } from "../../src/components/GameResult";
import { useGameStore } from "../../src/store/gameState";

// Mock the store
vi.mock("../../src/store/gameState", () => ({
  useGameStore: vi.fn(),
}));

describe("GameResult", () => {
  const mockPlayAgain = vi.fn();
  const mockNextRound = vi.fn();

  const mockStateBase = {
    impostorId: "socket-456", // Player 2 is Impostor
    myId: "socket-123",
    hostId: "socket-123",
    players: [
      { id: "socket-123", name: "Host", hasConfirmedNewRound: false },
      { id: "socket-456", name: "Impostor", hasConfirmedNewRound: false },
      { id: "socket-789", name: "Player 3", hasConfirmedNewRound: false },
      { id: "socket-999", name: "Player 4", hasConfirmedNewRound: false },
    ],
    secretWord: "Apple",
    secretCategory: "Food",
    votes: {}, // To be populated in tests
    gameMode: "CLASSIC",
    gameOptions: { virtualVotingEnabled: false },
    actions: { playAgain: mockPlayAgain, nextRound: mockNextRound },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Impostor Defeated if impostor receives most votes", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456",
        votes: {
          "socket-123": "socket-456", // Host votes Impostor
          "socket-789": "socket-456", // P3 votes Impostor
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Defeated")).toBeInTheDocument();

    expect(
      screen.getByText("Impostor was ejected and was the Inkpostor!"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ejected-player-card")).toBeInTheDocument();

    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("shows Impostor Won if normal player receives most votes", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-789",
        players: [
          { id: "socket-123", name: "Host" },
          { id: "socket-456", name: "Impostor" },
          { id: "socket-789", name: "Player 3", isEjected: true },
        ],
        votes: {
          "socket-123": "socket-789", // Host votes P3
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Won")).toBeInTheDocument();
    expect(
      screen.getByText("Player 3 was ejected. Impostor was the Inkpostor!"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ejected-player-card")).toBeInTheDocument();
  });

  it("shows Impostor Won when the impostor guessed the word, even after being ejected", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456", // impostor was ejected...
        impostorGuessedCorrectly: true, // ...but guessed the word
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Won")).toBeInTheDocument();
    expect(screen.queryByText("Inkpostor Defeated")).not.toBeInTheDocument();
    expect(screen.getByText("Impostor guessed the word!")).toBeInTheDocument();
  });

  it("shows Impostor Defeated when they spent a lethal guess pool", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        // Nobody was ejected: the impostor simply ran out of guesses
        ejectedId: null,
        impostorOutOfGuesses: true,
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Defeated")).toBeInTheDocument();
    expect(screen.queryByText("Inkpostor Won")).not.toBeInTheDocument();
    expect(screen.getByText("Impostor was the Inkpostor!")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    // Nobody was ejected, so the impostor is shown as a card...
    expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(1);
    expect(screen.queryByAltText("Inkpostor")).not.toBeInTheDocument();
    // ...and the reason the game ended is spelled out
    expect(screen.getByTestId("impostor-out-of-guesses")).toHaveTextContent(
      "Impostor used up every guess and never found the word!",
    );
  });

  it("shows the impostor card when they won by guessing without being ejected", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        gameEnded: true,
        // Guessed during DRAWING/VOTING, so no vote ever resolved
        ejectedId: null,
        impostorGuessedCorrectly: true,
      }),
    );

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Won")).toBeInTheDocument();
    expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(1);
    expect(screen.queryByAltText("Inkpostor")).not.toBeInTheDocument();
    expect(screen.getByText("Impostor guessed the word!")).toBeInTheDocument();
    expect(
      screen.queryByTestId("impostor-out-of-guesses"),
    ).not.toBeInTheDocument();
  });

  describe("with several impostors, a guess belongs to the one who made it", () => {
    // The cards reveal the whole team either way; only the purple line is about
    // the player who actually guessed.
    const twoImpostors = {
      ...mockStateBase,
      gameEnded: true,
      ejectedId: null,
      impostorIds: ["socket-456", "socket-999"],
    };

    it("names only the impostor who guessed the word", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector({
          ...twoImpostors,
          impostorGuessedCorrectly: true,
          guessingImpostorId: "socket-999",
        }),
      );

      render(<GameResult />);

      expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(2);
      expect(screen.getByText("Player 4 guessed the word!")).toBeInTheDocument();
      expect(
        screen.queryByText("Impostor, Player 4 guessed the word!"),
      ).not.toBeInTheDocument();
    });

    it("names only the impostor who burned the last guess", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector({
          ...twoImpostors,
          impostorOutOfGuesses: true,
          guessingImpostorId: "socket-456",
        }),
      );

      render(<GameResult />);

      expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(2);
      expect(screen.getByTestId("impostor-out-of-guesses")).toHaveTextContent(
        "Impostor used up every guess and never found the word!",
      );
    });

    it("falls back to the whole team when the server does not say who", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector({ ...twoImpostors, impostorGuessedCorrectly: true }),
      );

      render(<GameResult />);

      expect(
        screen.getByText("Impostor, Player 4 guessed the word!"),
      ).toBeInTheDocument();
    });
  });

  it("names the kicked impostor the server took out of the room", () => {
    // A vote-kick against the impostor ends the game and removes them from the
    // player list, so the screen only has the server's record to go on.
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456",
        kickedOutPlayers: [{ id: "socket-456", name: "Impostor" }],
        players: [
          { id: "socket-123", name: "Host" },
          { id: "socket-789", name: "Player 3" },
        ],
      }),
    );

    render(<GameResult />);

    expect(screen.getByText("Inkpostor Defeated")).toBeInTheDocument();
    expect(screen.getByTestId("ejected-player-card")).toHaveTextContent(
      "Impostor",
    );
    expect(
      screen.getByText("Impostor was ejected and was the Inkpostor!"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Unknown/)).not.toBeInTheDocument();
  });

  it("still names an impostor kicked earlier, while the game kept running", () => {
    // Two impostors: kicking one leaves the game going, and they are gone from
    // the room by the time the other is ejected and the reveal happens.
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        gameEnded: true,
        impostorIds: ["socket-456", "socket-999"],
        ejectedId: "socket-999",
        kickedOutPlayers: [{ id: "socket-456", name: "Impostor" }],
        players: [
          { id: "socket-123", name: "Host" },
          { id: "socket-789", name: "Player 3" },
          { id: "socket-999", name: "Player 4", isEjected: true },
        ],
      }),
    );

    render(<GameResult />);

    expect(screen.getByTestId("ejected-player-card")).toHaveTextContent(
      "Player 4",
    );
    expect(
      screen.getByText(
        "Player 4 was ejected! The Inkpostors were Player 4, Impostor!",
      ),
    ).toBeInTheDocument();
  });

  it("falls back to the impostor card when the ejected player cannot be named", () => {
    // Older server, or a kick it did not record: there is nobody to put in the
    // ejected card, so the screen reveals the impostors instead of writing a
    // sentence about a player it cannot name.
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-kicked",
        players: [
          { id: "socket-123", name: "Host" },
          { id: "socket-456", name: "Impostor" },
        ],
      }),
    );

    render(<GameResult />);

    expect(screen.queryByTestId("ejected-player-card")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(1);
    expect(screen.getByText("Impostor was the Inkpostor!")).toBeInTheDocument();
    expect(screen.queryByText(/was ejected/i)).not.toBeInTheDocument();
  });

  it("shows tie state if vote is tied", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        votes: {
          "socket-123": "socket-456", // Host votes Impostor
          "socket-456": "socket-789", // Impostor votes P3
        },
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Nobody was ejected...")).toBeInTheDocument();
  });

  it("tells the players no word was chosen when the game ended before one existed", () => {
    // The host ended the game while everyone was still writing their word.
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        secretWord: null,
        secretCategory: null,
        ejectedId: null,
        gameEnded: true,
      }),
    );

    render(<GameResult />);

    expect(screen.getByTestId("no-secret-word")).toHaveTextContent(
      "No word was chosen",
    );
    // The "the secret word was" label only makes sense when there is one
    expect(screen.queryByText("The secret word was")).not.toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("shows the secret word when there is one", () => {
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        ejectedId: "socket-456",
        gameEnded: true,
      }),
    );

    render(<GameResult />);

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByTestId("no-secret-word")).not.toBeInTheDocument();
  });

  describe("a spoken game played without the virtual voting", () => {
    // Nobody voted in the app, so the host simply opened the cards: the screen
    // is the list of impostors, not a verdict.
    const revealState = (overrides: Record<string, unknown> = {}) => ({
      ...mockStateBase,
      gameMode: "ORIGINAL",
      gameOptions: { virtualVotingEnabled: false },
      impostorIds: ["socket-456", "socket-999"],
      gameEnded: true,
      ejectedId: null,
      ...overrides,
    });

    it("lists the impostors under the title instead of a winner", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(revealState()),
      );

      render(<GameResult />);

      expect(screen.getByText("The Inkpostors")).toBeInTheDocument();
      expect(screen.queryByText("Inkpostor Defeated")).not.toBeInTheDocument();
      expect(screen.queryByText("Inkpostor Won")).not.toBeInTheDocument();

      const cards = screen.getAllByTestId("impostor-result-card");
      expect(cards.map((card) => card.textContent)).toEqual([
        "IImpostorINKPOSTOR",
        "PPlayer 4INKPOSTOR",
      ]);
      // ...and the same line the other endings use, under the cards
      expect(
        screen.getByText("The Inkpostors were Impostor, Player 4!"),
      ).toBeInTheDocument();
      // No ejection happened, so none of the vote wording belongs here
      expect(
        screen.queryByTestId("ejected-player-card"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Nobody was ejected..."),
      ).not.toBeInTheDocument();
    });

    it("centres the last card when the impostors do not fill the two columns", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(
          revealState({
            impostorIds: ["socket-456", "socket-999", "socket-789"],
          }),
        ),
      );

      render(<GameResult />);

      const cards = screen.getAllByTestId("impostor-result-card");
      expect(cards).toHaveLength(3);
      // The odd one out keeps a column's width and sits across both
      expect(cards[2]).toHaveClass("sm:col-span-2", "sm:justify-self-center");
      [cards[0], cards[1]].forEach((card) =>
        expect(card).not.toHaveClass("sm:col-span-2"),
      );
    });

    it("leaves every card in its own column when they pair up", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(revealState()),
      );

      render(<GameResult />);

      screen
        .getAllByTestId("impostor-result-card")
        .forEach((card) => expect(card).not.toHaveClass("sm:col-span-2"));
    });

    it("keeps the word reveal and the play again button", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(revealState()),
      );

      render(<GameResult />);

      expect(screen.getByText("The secret word was")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /play again/i }));
      expect(mockPlayAgain).toHaveBeenCalled();
    });

    it("shows the same screen in any mode when the host ends the game", () => {
      // Nothing was played out here either, so a winner would be a lie: the
      // character images and the verdict belong to a game that finished.
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(
          revealState({
            gameMode: "CLASSIC",
            gameOptions: { virtualVotingEnabled: false },
            endedByHost: true,
          }),
        ),
      );

      render(<GameResult />);

      expect(screen.getByText("The Inkpostors")).toBeInTheDocument();
      expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(2);
      expect(screen.queryByAltText("Inkpostor")).not.toBeInTheDocument();
      expect(screen.queryByText("Inkpostor Defeated")).not.toBeInTheDocument();
      expect(screen.queryByText("Inkpostor Won")).not.toBeInTheDocument();
    });

    it("still shows the verdict when the game was played out", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector({
          ...mockStateBase,
          gameMode: "CLASSIC",
          gameOptions: { virtualVotingEnabled: false },
          endedByHost: false,
          gameEnded: true,
          ejectedId: "socket-456",
        }),
      );

      render(<GameResult />);

      expect(screen.getByText("Inkpostor Defeated")).toBeInTheDocument();
      expect(
        screen.queryByTestId("impostor-result-card"),
      ).not.toBeInTheDocument();
    });

    it("names a lone impostor in the singular", () => {
      (useGameStore as any).mockImplementation((selector: any) =>
        selector(revealState({ impostorIds: ["socket-456"] })),
      );

      render(<GameResult />);

      expect(screen.getByText("The Inkpostor")).toBeInTheDocument();
      expect(screen.getAllByTestId("impostor-result-card")).toHaveLength(1);
      expect(
        screen.getByText("Impostor was the Inkpostor!"),
      ).toBeInTheDocument();
    });
  });

  it("allows host to play again", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456",
        votes: { "socket-123": "socket-456" },
      };
      return selector(state);
    });

    render(<GameResult />);

    const playAgainBtn = screen.getByRole("button", { name: /play again/i });
    fireEvent.click(playAgainBtn);
    expect(mockPlayAgain).toHaveBeenCalled();
  });

  it("hides play again button for non-hosts", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: true,
        myId: "socket-456",
        ejectedId: "socket-456", // Impostor caught
        votes: { "socket-456": "socket-123" },
      }; // Not host
      return selector(state);
    });

    render(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /play again/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Waiting for host to restart..."),
    ).toBeInTheDocument();
  });

  it("shows nobody ejected message when gameEnded is false and no ejectedId", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Nobody was ejected...")).toBeInTheDocument();
    expect(screen.getByTestId("vote-result-question-icon")).toBeInTheDocument();
  });

  it("shows was ejected message when gameEnded is false and ejectedId exists", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: "socket-789",
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(screen.getByText("Player 3 was ejected.")).toBeInTheDocument();
    expect(
      screen.getByText("Inkpostor is still among us..."),
    ).toBeInTheDocument();
    const resultTitle = screen.getByRole("heading", {
      name: "Result of the vote",
    });
    const ejectedPlayerCard = screen.getByTestId("ejected-player-card");

    expect(ejectedPlayerCard).toHaveTextContent("Player 3");
    expect(resultTitle.compareDocumentPosition(ejectedPlayerCard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByText("Ejected")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("vote-result-question-icon"),
    ).not.toBeInTheDocument();
  });

  it("shows Next Round button when game is not over and player hasn't confirmed", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
      };
      return selector(state);
    });

    render(<GameResult />);

    const nextRoundBtn = screen.getByRole("button", { name: /next round/i });
    expect(nextRoundBtn).toBeInTheDocument();

    fireEvent.click(nextRoundBtn);
    expect(mockNextRound).toHaveBeenCalled();
  });

  it("hides Next Round button after nextRound is clicked", () => {
    const mockState = {
      ...mockStateBase,
      gameEnded: false,
      ejectedId: null,
      players: mockStateBase.players.map((player) => ({ ...player })),
    };

    mockState.actions = {
      ...mockState.actions,
      nextRound: vi.fn(() => {
        mockState.players = mockState.players.map((player) =>
          player.id === mockState.myId
            ? { ...player, hasConfirmedNewRound: true }
            : player,
        );
      }),
    };

    (useGameStore as any).mockImplementation((selector: any) =>
      selector(mockState),
    );

    const { rerender } = render(<GameResult />);

    const nextRoundBtn = screen.getByRole("button", { name: /next round/i });
    fireEvent.click(nextRoundBtn);
    rerender(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /next round/i }),
    ).not.toBeInTheDocument();
  });

  it("shows waiting message when player has confirmed new round", () => {
    (useGameStore as any).mockImplementation((selector: any) => {
      const state = {
        ...mockStateBase,
        gameEnded: false,
        ejectedId: null,
        players: [
          {
            id: "socket-123",
            name: "Host",
            hasConfirmedNewRound: true,
            isEjected: false,
            isConnected: true,
          },
          {
            id: "socket-456",
            name: "Impostor",
            hasConfirmedNewRound: false,
            isEjected: false,
            isConnected: true,
          },
          {
            id: "socket-789",
            name: "Player 3",
            hasConfirmedNewRound: false,
            isEjected: false,
            isConnected: true,
          },
        ],
      };
      return selector(state);
    });

    render(<GameResult />);

    expect(
      screen.queryByRole("button", { name: /next round/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("1 of 3 players have confirmed to continue"),
    ).toBeInTheDocument();
  });

  it("leaves the way out to the topbar", () => {
    // The button lives in the topbar once the game is over, where it is the
    // only control left (see ReturnHomeButton).
    (useGameStore as any).mockImplementation((selector: any) =>
      selector({
        ...mockStateBase,
        gameEnded: true,
        ejectedId: "socket-456",
      }),
    );

    render(<GameResult />);

    expect(screen.queryByTestId("return-home-button")).not.toBeInTheDocument();
  });
});
