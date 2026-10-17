// Persistence: keeps the Run (and the profile's Best Score) on the device so
// nothing is lost when the OS closes the app. Everything lives under one
// storage key as a versioned envelope of named sections:
//
//   { version: 1, run: SaveData, profile: { best, lifetime, unlocked }, settings?: …, … }
//
// `run` is whatever core `serialize` returns, stored wholesale, so new optional
// SaveData fields persist without changes here. Other features (settings, the
// profile) store their own sections with `readSection` / `writeSection`;
// saving one section never drops the others. Anything unreadable falls back to
// a fresh state instead of crashing.
import { create, profileOf, restore, serialize, type GameState } from "../core";

/** The slice of `Storage` this module uses (inject a fake in tests). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = "block-blast";
/** Version of the envelope. Bump only if its layout changes; the Run has its own version. */
export const STORAGE_VERSION = 1;

type Sections = Record<string, unknown>;

export interface Persistence {
  /** The saved Run, or a fresh one (seeded by `seed`) carrying the saved Best Score. */
  loadRun(options: { seed: number }): GameState;
  /** Save the Run and the Best Score. Call after every Placement and on Play again. */
  saveRun(state: GameState): void;
  /** A section another feature saved, or `undefined`. Callers validate what they get. */
  readSection(name: string): unknown;
  /** Save a section, keeping every other section. */
  writeSection(name: string, value: unknown): void;
}

/** `storage` is `localStorage` in the app; `null` when unavailable (nothing is saved). */
export function createPersistence(storage: StorageLike | null): Persistence {
  function readAll(): Sections {
    let raw: string | null = null;
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return {};
    }
    if (raw === null) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function writeAll(sections: Sections): void {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ ...sections, version: STORAGE_VERSION }));
    } catch {
      // Storage full or blocked: keep playing; the Run just won't survive a restart.
    }
  }

  function writeSection(name: string, value: unknown): void {
    writeAll({ ...readAll(), [name]: value });
  }

  return {
    loadRun({ seed }) {
      const sections = readAll();
      const profile = savedProfile(sections.profile);
      if (isRecord(sections.run)) {
        try {
          const run = restore(sections.run as never);
          // The profile section never loses progress the saved Run doesn't have.
          return restore({
            ...serialize(run),
            best: Math.max(run.best, profile.best),
            lifetime: Math.max(run.lifetime, profile.lifetime),
            unlocked: [...run.unlocked, ...profile.unlocked],
          });
        } catch {
          // Old version or corrupted: fall through to a fresh Run.
        }
      }
      return create({ seed, profile });
    },

    saveRun(state) {
      const sections = readAll();
      const profile = isRecord(sections.profile) ? sections.profile : {};
      writeAll({ ...sections, run: serialize(state), profile: { ...profile, ...profileOf(state) } });
    },

    readSection(name) {
      return readAll()[name];
    },

    writeSection,
  };
}

/** The saved profile, field by field: anything missing or invalid reads as a new player's value. */
function savedProfile(profile: unknown): { best: number; lifetime: number; unlocked: string[] } {
  const p = isRecord(profile) ? profile : {};
  const count = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0);
  const unlocked = Array.isArray(p.unlocked) ? p.unlocked.filter((id): id is string => typeof id === "string") : [];
  return { best: count(p.best), lifetime: count(p.lifetime), unlocked };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
