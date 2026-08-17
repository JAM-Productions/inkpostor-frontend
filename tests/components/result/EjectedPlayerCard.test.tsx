import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EjectedPlayerCard } from "../../../src/components/result/EjectedPlayerCard";
import type { Player } from "../../../src/store/gameState";

describe("EjectedPlayerCard", () => {
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

  it("names the player and stamps them as ejected", () => {
    render(
      <EjectedPlayerCard
        player={players[1]}
        hostId="host-1"
        players={players}
      />,
    );

    const card = screen.getByTestId("ejected-player-card");
    expect(card).toHaveTextContent("Bob");
    expect(card).toHaveTextContent("EJECTED");
    expect(card.firstElementChild).toHaveTextContent("B");
  });

  it("tints the avatar with that player's own colour", () => {
    render(
      <EjectedPlayerCard
        player={players[1]}
        hostId="host-1"
        players={players}
      />,
    );

    // Bob is the second player, so he gets the second palette entry
    expect(
      screen.getByTestId("ejected-player-card").firstElementChild,
    ).toHaveClass("bg-emerald-500");
  });

  it("still works for a player the room no longer holds", () => {
    // A kick takes its target out of the room, but the server keeps their name
    const kicked = createPlayer("gone", "Kicked");

    render(
      <EjectedPlayerCard player={kicked} hostId="host-1" players={players} />,
    );

    expect(screen.getByTestId("ejected-player-card")).toHaveTextContent(
      "Kicked",
    );
  });
});
