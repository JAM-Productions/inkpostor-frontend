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
 * Deep equality for the plain data a room update is made of: primitives, arrays
 * and object literals. Deliberately narrow — no dates, maps, sets or cycles,
 * because none of that travels over the wire.
 */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => isDeepEqual(item, b[i]));
  }

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
}

/**
 * Hands back the previous value when the new one only differs by identity.
 *
 * A room update rebuilds every field it carries, so `players`, `gameOptions` and
 * the vote maps arrive as fresh objects even when nothing about them changed.
 * The store compares by identity, so without this every subscriber re-renders on
 * every update from the server.
 */
export function keepIfEqual<T>(previous: T, next: T): T {
  return isDeepEqual(previous, next) ? previous : next;
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
