import type { GameState, Player } from "../store/gameState";

export const PLAYER_NAME_KEY = "inkpostor_player_name";
export const USER_ID_KEY = "inkpostor_user_id";

export function detectIsMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export function getSavedPlayerName(): string | null {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch {
    return null;
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch (e) {
    console.error("Error saving player name to localStorage:", e);
  }
}

export function getOrCreateUserId(): string {
  let id = null;
  try {
    id = localStorage.getItem(USER_ID_KEY);
  } catch (e) {
    console.error("Error reading userId from localStorage:", e);
  }

  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(USER_ID_KEY, id);
    } catch (e) {
      console.error("Error saving userId to localStorage:", e);
    }
  }
  return id;
}

export function clearRoomUrlParam(): void {
  try {
    if (typeof window !== "undefined" && window.history) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        window.history.replaceState(
          {},
          document.title,
          url.pathname + url.search,
        );
      }
    }
  } catch (e) {
    console.error("Error clearing URL parameters:", e);
  }
}

/**
 * Returns a partial state that applies `patch` to the local player (`myId`)
 * inside the `players` array. Used for optimistic updates that flip a flag on
 * the current player. Returns the unchanged state if there is no local id.
 */
export function patchMyPlayer(
  state: GameState,
  patch: Partial<Player>,
): Partial<GameState> {
  if (!state.myId) return state;
  return {
    players: state.players.map((p) =>
      p.id === state.myId ? { ...p, ...patch } : p,
    ),
  };
}
