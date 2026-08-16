import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoundBody } from "../../../src/components/result/RoundBody";
import type { Player } from "../../../src/store/gameState";

describe("RoundBody", () => {
  const createPlayer = (id: string, name: string): Player => ({
    id,
    name,
    isConnected: true,
    score: 0,
    hasStartedEmergencyVoting: false,
  });

  const players = [createPlayer("host-1", "Host"), createPlayer("p2", "Bob")];

  const defaults = {
    players,
    hostId: "host-1",
    ejectedPlayer: players[1],
    ejectedName: "Bob",
    isEjectedImpostor: false,
    remainingImpostorCount: 0,
  };

  it("says an ejected crewmate leaves the Inkpostor in play", () => {
    render(<RoundBody {...defaults} />);

    expect(screen.getByTestId("ejected-player-card")).toHaveTextContent("Bob");
    expect(screen.getByText("Bob was ejected.")).toBeInTheDocument();
    expect(
      screen.getByText("Inkpostor is still among us..."),
    ).toBeInTheDocument();
  });

  it("counts the Inkpostors left when one of them is ejected", () => {
    render(
      <RoundBody
        {...defaults}
        isEjectedImpostor={true}
        remainingImpostorCount={2}
      />,
    );

    expect(screen.getByTestId("impostor-ejected-remaining")).toHaveTextContent(
      "Bob was an Inkpostor! There are still 2 Inkpostors left among us.",
    );
    expect(
      screen.queryByText("Inkpostor is still among us..."),
    ).not.toBeInTheDocument();
  });

  it("shows a question mark when the vote settled nothing", () => {
    render(
      <RoundBody
        {...defaults}
        ejectedPlayer={undefined}
        ejectedName={undefined}
      />,
    );

    expect(screen.getByTestId("vote-result-question-icon")).toBeInTheDocument();
    expect(screen.getByText("Nobody was ejected...")).toBeInTheDocument();
    expect(screen.queryByTestId("ejected-player-card")).not.toBeInTheDocument();
  });

  it("never talks about a guess, because a guess ends the game", () => {
    // The server only reports one with the game already over, which is a
    // verdict — naming a guesser here would point straight at an impostor.
    render(<RoundBody {...defaults} isEjectedImpostor={true} />);

    expect(
      screen.queryByTestId("impostor-out-of-guesses"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/guessed the word/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/was the Inkpostor!/)).not.toBeInTheDocument();
  });
});
