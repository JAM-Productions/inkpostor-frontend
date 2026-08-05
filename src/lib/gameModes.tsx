import React from "react";
import { Dices, Drama, Flame, MessagesSquare, PartyPopper } from "lucide-react";
import type { GameMode } from "../store/gameState";

export interface GameModeDefinition {
  id: GameMode;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  isInPerson?: boolean;
}

// Order defines the carousel order.
export const GAME_MODES: GameModeDefinition[] = [
  {
    id: "CLASSIC",
    nameKey: "options.gameMode.classic.name",
    descriptionKey: "options.gameMode.classic.description",
    icon: <Dices className="size-5" />,
  },
  {
    id: "CUSTOM_WORD",
    nameKey: "options.gameMode.customWord.name",
    descriptionKey: "options.gameMode.customWord.description",
    icon: <PartyPopper className="size-5" />,
  },
  {
    id: "HOT_WORD",
    nameKey: "options.gameMode.hotWord.name",
    descriptionKey: "options.gameMode.hotWord.description",
    icon: <Flame className="size-5" />,
  },
  {
    id: "ORIGINAL",
    nameKey: "options.gameMode.original.name",
    descriptionKey: "options.gameMode.original.description",
    icon: <MessagesSquare className="size-5" />,
    isInPerson: true,
  },
  {
    id: "ORIGINAL_CHAOS",
    nameKey: "options.gameMode.originalChaos.name",
    descriptionKey: "options.gameMode.originalChaos.description",
    icon: <Drama className="size-5" />,
    isInPerson: true,
  },
];
