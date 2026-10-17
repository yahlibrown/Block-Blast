import { describe, expect, it } from "vitest";
import type { Sound } from "../audio/audio";
import type { FeedbackCue } from "./director";
import { createSensoryPlayer } from "./sensoryPlayer";

function setup() {
  const played: Sound[][] = [];
  const vibrated: (readonly number[])[] = [];
  const player = createSensoryPlayer(
    { play: (sounds) => played.push([...sounds]) },
    { vibrate: (pattern) => vibrated.push(pattern) },
  );
  return { player, played, vibrated };
}

describe("the sensory player", () => {
  it("plays a Placement's sounds together, in cue order, and its vibration", () => {
    const { player, played, vibrated } = setup();
    const cues: FeedbackCue[] = [
      { kind: "sound", sound: { kind: "thunk" } },
      { kind: "praise", text: "Good!", tier: 0 },
      { kind: "sound", sound: { kind: "clear", lines: 1 } },
      { kind: "haptic", pattern: [30] },
    ];

    player.play(cues, 0);

    expect(played).toEqual([[{ kind: "thunk" }, { kind: "clear", lines: 1 }]]);
    expect(vibrated).toEqual([[30]]);
  });

  it("is never busy: sounds and vibration run on their own clocks", () => {
    const { player } = setup();
    player.play([{ kind: "sound", sound: { kind: "thunk" } }], 0);

    expect(player.busy(0)).toBe(false);
  });
});
