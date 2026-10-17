import { describe, expect, it } from "vitest";
import { create, profileOf, restore, serialize, type GameState } from "../core";
import { createPersistence, STORAGE_KEY, type StorageLike } from "./persistence";

/** In-memory stand-in for localStorage. */
function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function midRun(): GameState {
  return restore({
    version: 1,
    board: Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (r === 0 && c < 5 ? 4 : null)),
    ),
    tray: [{ piece: "dot", color: 2 }, null, { piece: "h3", color: 0 }],
    rng: 777,
    score: 120,
    best: 300,
    combo: 2,
    dry: 1,
  });
}

const SEED = 42;

describe("loading the Run at startup", () => {
  it("starts a fresh Run when nothing was saved", () => {
    const persistence = createPersistence(memoryStorage());

    expect(serialize(persistence.loadRun({ seed: SEED }))).toEqual(serialize(create({ seed: SEED })));
  });

  it("resumes the saved Run exactly", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(midRun());

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(serialize(loaded)).toEqual(serialize(midRun()));
  });

  it("resumes a finished Run as over", () => {
    const storage = memoryStorage();
    const finished = restore({ ...serialize(midRun()), over: true });
    createPersistence(storage).saveRun(finished);

    expect(createPersistence(storage).loadRun({ seed: SEED }).over).toBe(true);
  });

  it("keeps the Best Score across Runs", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(midRun());

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(loaded.best).toBe(300);
  });
});

describe("falling back to a fresh Run", () => {
  it("starts fresh when the saved data is not JSON", () => {
    const persistence = createPersistence(memoryStorage({ [STORAGE_KEY]: "{not json" }));

    expect(serialize(persistence.loadRun({ seed: SEED }))).toEqual(serialize(create({ seed: SEED })));
  });

  it("starts fresh when the saved data is not an object", () => {
    for (const raw of ["null", "42", '"hello"', "[]"]) {
      const persistence = createPersistence(memoryStorage({ [STORAGE_KEY]: raw }));

      expect(serialize(persistence.loadRun({ seed: SEED }))).toEqual(serialize(create({ seed: SEED })));
    }
  });

  it("starts fresh, keeping the Best Score, when the saved Run is from an old version", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(midRun());
    const saved = JSON.parse(storage.data[STORAGE_KEY]);
    saved.run.version = 0;
    storage.data[STORAGE_KEY] = JSON.stringify(saved);

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(serialize(loaded)).toEqual(serialize(create({ seed: SEED, best: 300 })));
  });

  it("starts fresh, keeping the Best Score, when the saved Run is corrupted", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(midRun());
    const saved = JSON.parse(storage.data[STORAGE_KEY]);
    saved.run.board = "garbage";
    storage.data[STORAGE_KEY] = JSON.stringify(saved);

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(serialize(loaded)).toEqual(serialize(create({ seed: SEED, best: 300 })));
  });

  it("starts fresh when the whole save is from another storage version", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(midRun());
    const saved = JSON.parse(storage.data[STORAGE_KEY]);
    saved.version = 99;
    storage.data[STORAGE_KEY] = JSON.stringify(saved);

    expect(serialize(createPersistence(storage).loadRun({ seed: SEED }))).toEqual(
      serialize(create({ seed: SEED })),
    );
  });

  it("ignores a corrupted Best Score", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, profile: { best: "lots" } }),
    });

    expect(createPersistence(storage).loadRun({ seed: SEED }).best).toBe(0);
  });

  it("works without storage at all, or when storage throws", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    for (const storage of [null, throwing]) {
      const persistence = createPersistence(storage);

      expect(serialize(persistence.loadRun({ seed: SEED }))).toEqual(serialize(create({ seed: SEED })));
      expect(() => persistence.saveRun(midRun())).not.toThrow();
    }
  });
});

describe("the profile (Lifetime Points and Skins)", () => {
  const progressed = () =>
    restore({ ...serialize(midRun()), lifetime: 6000, unlocked: ["classic", "neon", "gold"] });

  it("survives a reload with the Run", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(progressed());

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(profileOf(loaded)).toEqual({ best: 300, lifetime: 6000, unlocked: ["classic", "neon", "gold"] });
  });

  it("carries into a fresh Run when the saved Run is unusable", () => {
    const storage = memoryStorage();
    createPersistence(storage).saveRun(progressed());
    const saved = JSON.parse(storage.data[STORAGE_KEY]);
    saved.run.board = "garbage";
    storage.data[STORAGE_KEY] = JSON.stringify(saved);

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(profileOf(loaded)).toEqual({ best: 300, lifetime: 6000, unlocked: ["classic", "neon", "gold"] });
    expect(loaded.score).toBe(0);
  });

  it("is never lowered by an older saved Run", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        run: serialize(midRun()),
        profile: { best: 50, lifetime: 9000, unlocked: ["candy"] },
      }),
    });

    const loaded = createPersistence(storage).loadRun({ seed: SEED });

    expect(profileOf(loaded)).toEqual({ best: 300, lifetime: 9000, unlocked: ["classic", "neon", "candy"] });
  });

  it("ignores invalid profile fields one by one", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, profile: { best: 10, lifetime: -5, unlocked: "all" } }),
    });

    expect(profileOf(createPersistence(storage).loadRun({ seed: SEED }))).toEqual({
      best: 10,
      lifetime: 0,
      unlocked: ["classic"],
    });
  });
});

describe("other saved sections", () => {
  it("keeps a section another feature saved when the Run is saved", () => {
    const storage = memoryStorage();
    const persistence = createPersistence(storage);
    persistence.writeSection("settings", { sound: false });

    persistence.saveRun(midRun());

    expect(createPersistence(storage).readSection("settings")).toEqual({ sound: false });
  });

  it("reads a missing section as undefined", () => {
    expect(createPersistence(memoryStorage()).readSection("settings")).toBeUndefined();
  });
});
