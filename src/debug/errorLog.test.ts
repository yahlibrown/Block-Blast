import { describe, expect, it } from "vitest";
import { startErrorLog } from "./errorLog";

/** An uncaught error as the browser reports it on `window` ("error" event). */
function errorEvent(error: unknown, message: string): Event {
  return Object.assign(new Event("error"), { error, message, filename: "main.ts", lineno: 12, colno: 3 });
}

/** An unhandled promise rejection ("unhandledrejection" event). */
function rejectionEvent(reason: unknown): Event {
  return Object.assign(new Event("unhandledrejection"), { reason });
}

function start(search: string) {
  const target = new EventTarget();
  const shown: string[] = [];
  const started = startErrorLog({ search, target, show: (line) => shown.push(line) });
  return { target, shown, started };
}

describe("error log", () => {
  it("shows nothing and listens to nothing without the debug flag", () => {
    const { target, shown, started } = start("");

    target.dispatchEvent(errorEvent(new Error("boom"), "Uncaught Error: boom"));
    target.dispatchEvent(rejectionEvent(new Error("nope")));

    expect(started).toBe(false);
    expect(shown).toEqual([]);
  });

  it("shows a thrown error with the debug flag", () => {
    const { target, shown, started } = start("?debug");

    target.dispatchEvent(errorEvent(new Error("boom"), "Uncaught Error: boom"));

    expect(started).toBe(true);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toContain("boom");
    expect(shown[0]).toContain("main.ts:12:3");
  });

  it("shows an unhandled rejection with the debug flag", () => {
    const { target, shown } = start("?debug");

    target.dispatchEvent(rejectionEvent(new Error("nope")));
    target.dispatchEvent(rejectionEvent("plain reason"));

    expect(shown).toHaveLength(2);
    expect(shown[0]).toContain("nope");
    expect(shown[1]).toContain("plain reason");
  });

  it("accepts the flag among other query parameters, with or without a value", () => {
    expect(start("?skin=neon&debug").started).toBe(true);
    expect(start("?debug=1").started).toBe(true);
    expect(start("?debugger").started).toBe(false);
  });
});
