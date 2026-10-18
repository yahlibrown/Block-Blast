// Home Screen Hint: whether the Game Over screen shows the card inviting iPhone
// players in a Safari tab to add the game to their Home Screen. Its state (a Game
// Over count and a dismissed flag) is the "homeScreenHint" section of the
// persistence envelope; writing it keeps every other section.
import type { DeviceFacts } from "../device/deviceFacts";
import type { Persistence } from "./persistence";

export interface HomeScreenHint {
  /** Whether the Game Over screen shows the card now. */
  readonly shown: boolean;
  /** A Run just ended: count it. */
  reachedGameOver(): void;
  /** The player closed the card: it never shows again. */
  dismiss(): void;
}

const SECTION = "homeScreenHint";
/** Not after the very first Game Over: the player should know whether they like the game. */
const MIN_GAME_OVERS = 2;

interface SavedHint {
  readonly gameOvers: number;
  readonly dismissed: boolean;
}

export function createHomeScreenHint(
  persistence: Persistence,
  device: Pick<DeviceFacts, "iPhoneSafariTab">,
): HomeScreenHint {
  function load(): SavedHint {
    const raw = persistence.readSection(SECTION);
    const record = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const n = record.gameOvers;
    return {
      gameOvers: typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : 0,
      dismissed: record.dismissed === true,
    };
  }

  function save(saved: SavedHint): void {
    persistence.writeSection(SECTION, { gameOvers: saved.gameOvers, dismissed: saved.dismissed });
  }

  return {
    get shown() {
      const saved = load();
      return device.iPhoneSafariTab && !saved.dismissed && saved.gameOvers >= MIN_GAME_OVERS;
    },
    reachedGameOver() {
      const saved = load();
      save({ ...saved, gameOvers: saved.gameOvers + 1 });
    },
    dismiss() {
      save({ ...load(), dismissed: true });
    },
  };
}
