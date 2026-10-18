import { describe, expect, it } from "vitest";
import { requestPersistentStorage } from "./persistentStorage";

/** Node's process events (tests run in Node; the app's tsconfig has no Node types). */
declare const process: {
  on(event: "unhandledRejection", listener: (reason: unknown) => void): void;
  off(event: "unhandledRejection", listener: (reason: unknown) => void): void;
};

describe("persistent storage request", () => {
  it("asks the browser to keep the site's data", () => {
    let asked = 0;
    requestPersistentStorage({
      storage: {
        persist: async () => {
          asked++;
          return true;
        },
      },
    });

    expect(asked).toBe(1);
  });

  it.each([
    ["no navigator", undefined],
    ["no storage manager", {}],
    ["no persist()", { storage: {} }],
    [
      "persist() throwing",
      {
        storage: {
          persist: () => {
            throw new Error("blocked");
          },
        },
      },
    ],
    ["persist() refusing", { storage: { persist: () => Promise.resolve(false) } }],
  ])("never throws with %s", (_, nav) => {
    expect(() => requestPersistentStorage(nav)).not.toThrow();
  });

  it("swallows a rejected request", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      requestPersistentStorage({ storage: { persist: () => Promise.reject(new Error("denied")) } });
      await new Promise((resolve) => setTimeout(resolve, 10));
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }

    expect(unhandled).toEqual([]);
  });

  it("returns at once without waiting for the answer", () => {
    expect(requestPersistentStorage({ storage: { persist: () => new Promise<boolean>(() => {}) } })).toBeUndefined();
  });
});
