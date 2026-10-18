import { describe, expect, it } from "vitest";
import { createAudio } from "./audio";

type State = "suspended" | "running" | "interrupted" | "closed";

/**
 * A fake AudioContext: enough of Web Audio for the sounds to be built, recording
 * how many sounds (oscillators) and silent unlock blips (buffer sources) start.
 * `resume()` stays pending until the test settles it, like a real browser.
 */
function fakeContext(initial: State = "suspended") {
  const log = { tones: 0, blips: 0, resumes: 0 };
  let settle: ((ok: boolean) => void) | null = null;
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({ connect() {}, gain: param(), frequency: param(), Q: param(), type: "" });
  const ctx = {
    state: initial as State,
    currentTime: 0,
    sampleRate: 1000,
    destination: {},
    createDynamicsCompressor: node,
    createGain: node,
    createBiquadFilter: node,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => ({
      ...node(),
      buffer: null as unknown,
      start(this: { buffer: { getChannelData(): Float32Array } | null }) {
        if (this.buffer && this.buffer.getChannelData().length === 1) log.blips++;
      },
      stop() {},
    }),
    createOscillator: () => ({ ...node(), start: () => log.tones++, stop() {} }),
    resume() {
      log.resumes++;
      return new Promise<void>((resolve, reject) => {
        settle = (ok) => {
          if (ok) {
            ctx.state = "running";
            resolve();
          } else reject(new Error("not allowed"));
        };
      });
    },
  };
  return {
    ctx,
    log,
    /** The browser lets the pending resume through (or refuses it). */
    async settleResume(ok = true) {
      settle?.(ok);
      settle = null;
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

function setUp(...contexts: ReturnType<typeof fakeContext>[]) {
  let made = 0;
  const audio = createAudio(() => (contexts[made++]?.ctx as unknown as AudioContext) ?? null);
  return { audio, contexts: () => made };
}

const thunk = [{ kind: "thunk" }] as const;

describe("audio", () => {
  it("stays silent until the first touch unlocks it", () => {
    const fake = fakeContext();
    const { audio, contexts } = setUp(fake);

    audio.play(thunk);

    expect(contexts()).toBe(0);
    expect(fake.log.tones).toBe(0);
  });

  it("plays sounds once unlocked and running", async () => {
    const fake = fakeContext();
    const { audio } = setUp(fake);

    audio.unlock();
    await fake.settleResume();
    audio.play(thunk);

    expect(fake.log.tones).toBeGreaterThan(0);
  });

  it("plays the first Placement's sound in the touch that unlocks it, before the resume settles", () => {
    const fake = fakeContext();
    const { audio } = setUp(fake);

    audio.unlock();
    audio.play(thunk);

    expect(fake.log.tones).toBeGreaterThan(0);
  });

  it("stays silent, without queuing sounds, when the browser refuses to resume", async () => {
    const fake = fakeContext();
    const { audio } = setUp(fake);

    audio.unlock();
    await fake.settleResume(false);
    fake.log.tones = 0;
    audio.play(thunk);

    expect(fake.log.tones).toBe(0);
  });

  for (const state of ["suspended", "interrupted"] as const) {
    it(`re-unlocks on the next touch after coming back from the background (${state})`, async () => {
      const fake = fakeContext();
      const { audio, contexts } = setUp(fake);
      audio.unlock();
      await fake.settleResume();

      // The player switches apps or locks the phone; the browser stops the context.
      fake.ctx.state = state;
      fake.log.tones = 0;
      const blipsBefore = fake.log.blips;
      audio.play(thunk);
      expect(fake.log.tones).toBe(0);

      // Back in the game: the next touch resumes it (re-priming inside the gesture).
      audio.unlock();
      audio.play(thunk);

      expect(fake.log.resumes).toBe(2);
      expect(fake.log.blips).toBeGreaterThan(blipsBefore);
      expect(fake.log.tones).toBeGreaterThan(0);
      expect(contexts()).toBe(1);
    });
  }

  it("starts a fresh context on the next touch if the browser closed the old one", async () => {
    const first = fakeContext();
    const second = fakeContext();
    const { audio, contexts } = setUp(first, second);
    audio.unlock();
    await first.settleResume();

    first.ctx.state = "closed";
    audio.unlock();
    await second.settleResume();
    audio.play(thunk);

    expect(contexts()).toBe(2);
    expect(second.log.tones).toBeGreaterThan(0);
  });

  it("asks iOS for an ambient audio session, so the silent switch mutes it", () => {
    const session = { type: "auto" };

    createAudio(() => null, session);

    expect(session.type).toBe("ambient");
  });

  it("works where there is no audio session API", () => {
    expect(() => createAudio(() => null, undefined).unlock()).not.toThrow();
  });
});
