import React from "react";
import { Dices, Flame, PartyPopper } from "lucide-react";
import type { GameMode } from "../store/gameState";

export interface GameModeDefinition {
  id: GameMode;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
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
];
