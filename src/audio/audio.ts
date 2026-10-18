// Audio: every sound is synthesized with the Web Audio API (no asset files).
//
// Browsers only let audio start from a user gesture, so the AudioContext is
// created (or resumed) by `unlock()`, which the shell calls on every touch.
// Sounds requested before that are dropped silently. When the browser stops
// the context (the app was backgrounded, the phone locked, a call came in),
// the next `unlock()` resumes it, or replaces it if it was closed. While
// `enabled` is false (the sound setting), `play` does nothing.

/** The game's sounds. `chime` carries its pitch (rising per Combo step). */
export type Sound =
  | { readonly kind: "thunk" }
  | { readonly kind: "clear"; readonly lines: number }
  | { readonly kind: "chime"; readonly level: number; readonly frequency: number }
  | { readonly kind: "boardClear" };

export interface Audio {
  /** The sound setting; while false, `play` does nothing. */
  enabled: boolean;
  /** Create/resume the AudioContext. Call from a user gesture handler. */
  unlock(): void;
  /** Start these sounds now (together; each schedules its own timing). */
  play(sounds: readonly Sound[]): void;
}

const MASTER_GAIN = 0.8;
/** Delay before the Combo chime, so it rings just after the Clear's whoosh starts. */
const CHIME_DELAY_S = 0.06;

/** The iOS Audio Session API (`navigator.audioSession`, Safari 17+). */
export interface AudioSession {
  type: string;
}

/**
 * `session` is the page's audio session where the browser has one. It is set to
 * "ambient": game sounds obey the iPhone's silent switch and mix with the player's
 * music, like a normal casual game (never a "playback" session that ignores the switch).
 */
export function createAudio(
  createContext: () => AudioContext | null = defaultContext,
  session: AudioSession | null | undefined = defaultSession(),
): Audio {
  try {
    if (session) session.type = "ambient";
  } catch {
    // An unsupported session type: keep the browser's default.
  }
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  /** A resume asked for from a gesture and not yet settled: sounds scheduled now play once it does. */
  let resuming = false;

  function setUp(context: AudioContext): void {
    const compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);
    master = context.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(compressor);
    noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.6), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  /** Resume a stopped context from a gesture. iOS only unlocks once something plays inside it. */
  function wake(context: AudioContext): void {
    const silent = context.createBufferSource();
    silent.buffer = context.createBuffer(1, 1, context.sampleRate);
    silent.connect(context.destination);
    silent.start();
    resuming = true;
    const settled = () => {
      if (ctx === context) resuming = false;
    };
    void context.resume().then(settled, settled);
  }

  return {
    enabled: true,
    unlock() {
      try {
        if (!ctx || ctx.state === "closed") {
          resuming = false;
          ctx = createContext();
          if (!ctx) return;
          setUp(ctx);
        }
        if (ctx.state !== "running" && !resuming) wake(ctx);
      } catch {
        // No Web Audio: the game stays silent.
      }
    },
    play(sounds) {
      if (!this.enabled || !ctx || !master || !noise || (ctx.state !== "running" && !resuming)) return;
      const t = ctx.currentTime;
      try {
        for (const sound of sounds) {
          switch (sound.kind) {
            case "thunk":
              thunk(ctx, master, noise, t);
              break;
            case "clear":
              clear(ctx, master, noise, t, sound.lines);
              break;
            case "chime":
              chime(ctx, master, t + CHIME_DELAY_S, sound.frequency);
              break;
            case "boardClear":
              boardClear(ctx, master, t + 0.12);
              break;
          }
        }
      } catch {
        // A failed sound must never break a Placement.
      }
    },
  };
}

function defaultSession(): AudioSession | undefined {
  return (globalThis.navigator as unknown as { audioSession?: AudioSession } | undefined)?.audioSession;
}

function defaultContext(): AudioContext | null {
  const Ctor =
    globalThis.AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** Attack-decay envelope on a new gain node. */
function envelope(ctx: AudioContext, out: AudioNode, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(out);
  return g;
}

function noiseSource(ctx: AudioContext, noise: AudioBuffer, t: number, duration: number): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.start(t);
  src.stop(t + duration);
  return src;
}

/** Landing: a low sine drop plus a soft muffled click. */
function thunk(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, t: number): void {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.1);
  osc.connect(envelope(ctx, out, t, 0.8, 0.004, 0.16));
  osc.start(t);
  osc.stop(t + 0.2);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  filter.connect(envelope(ctx, out, t, 0.3, 0.002, 0.04));
  noiseSource(ctx, noise, t, 0.06).connect(filter);
}

/** Clear: a bright rising whoosh, longer and louder for bigger Multi-Clears. */
function clear(ctx: AudioContext, out: AudioNode, noise: AudioBuffer, t: number, lines: number): void {
  const size = Math.min(Math.max(lines, 1), 6);
  const duration = 0.22 + 0.06 * (size - 1);
  const peak = Math.min(0.3 + 0.06 * (size - 1), 0.6);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(4500, t + duration);
  filter.connect(envelope(ctx, out, t, peak, 0.02, duration));
  noiseSource(ctx, noise, t, duration + 0.05).connect(filter);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.exponentialRampToValueAtTime(330 * (1.5 + 0.25 * size), t + duration);
  osc.connect(envelope(ctx, out, t, peak * 0.5, 0.01, duration));
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Combo chime: a bell-like sine with an octave overtone. */
function chime(ctx: AudioContext, out: AudioNode, t: number, frequency: number): void {
  for (const [ratio, peak] of [
    [1, 0.35],
    [2, 0.12],
    [3, 0.05],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency * ratio;
    osc.connect(envelope(ctx, out, t, peak, 0.005, 0.8 / ratio));
    osc.start(t);
    osc.stop(t + 0.9);
  }
}

/** Board Clear: a quick rising major arpeggio fanfare. */
function boardClear(ctx: AudioContext, out: AudioNode, t: number): void {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((frequency, i) => {
    const start = t + i * 0.08;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    osc.connect(envelope(ctx, out, start, 0.3, 0.01, i === 4 ? 0.9 : 0.35));
    osc.start(start);
    osc.stop(start + 1);
  });
}
