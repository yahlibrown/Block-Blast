// Sensory player: hands the director's `sound` and `haptic` cues to the audio and
// haptics modules (which check the settings themselves).
import type { Audio } from "../audio/audio";
import type { Haptics } from "../haptics/haptics";
import type { CuePlayer } from "./director";

export function createSensoryPlayer(
  audio: Pick<Audio, "play">,
  haptics: Pick<Haptics, "vibrate">,
): CuePlayer {
  return {
    play(cues) {
      const sounds = cues.flatMap((c) => (c.kind === "sound" ? [c.sound] : []));
      for (const cue of cues) if (cue.kind === "haptic") haptics.vibrate(cue.pattern);
      audio.play(sounds);
    },
    reset() {},
    busy: () => false,
  };
}
