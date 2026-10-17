import { describe, expect, it } from "vitest";
import { createFrameLoop } from "./loop";

/** A fake requestAnimationFrame: frames run only when the test calls `tick`. */
function fakeFrames() {
  let queued: ((now: number) => void)[] = [];
  return {
    raf: (cb: (now: number) => void) => {
      queued.push(cb);
    },
    tick(now: number) {
      const run = queued;
      queued = [];
      run.forEach((cb) => cb(now));
    },
    pending: () => queued.length,
  };
}

describe("the frame loop", () => {
  it("draws once on the next frame however many times it is invalidated", () => {
    const frames = fakeFrames();
    const draws: number[] = [];
    const loop = createFrameLoop((now) => draws.push(now), frames.raf);

    loop.invalidate();
    loop.invalidate();
    loop.invalidate();
    expect(draws).toEqual([]);

    frames.tick(16);
    expect(draws).toEqual([16]);

    frames.tick(32);
    expect(draws).toEqual([16]);
  });

  it("keeps drawing every frame while an animation runs, then goes idle", () => {
    const frames = fakeFrames();
    const draws: number[] = [];
    const loop = createFrameLoop((now) => draws.push(now), frames.raf);

    loop.animate((now) => now < 48); // alive until 48ms

    frames.tick(16);
    frames.tick(32);
    frames.tick(48);
    frames.tick(64);
    expect(draws).toEqual([16, 32, 48]);
    expect(frames.pending()).toBe(0);
  });
});
