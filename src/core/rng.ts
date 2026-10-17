// Seeded random source (mulberry32). Pure: the state is a uint32 carried in
// GameState, so a Run (and its dealing) is reproducible from its seed.

export type RngState = number;

export function seedRng(seed: number): RngState {
  return seed >>> 0;
}

/** Returns a float in [0, 1) and the next state. */
export function nextFloat(state: RngState): [number, RngState] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Returns an integer in [0, n) and the next state. */
export function nextInt(state: RngState, n: number): [number, RngState] {
  const [f, next] = nextFloat(state);
  return [Math.floor(f * n), next];
}
