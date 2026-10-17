// Score count-up: a number that rolls up to its new value instead of jumping.
// Time-driven and pure (the caller passes `now`, e.g. the frame loop's rAF time).

/** Roll duration grows with the size of the gain, within these bounds (ms). */
const MIN_MS = 250;
const MAX_MS = 700;
const MS_PER_POINT = 2;

export interface CountUp {
  /** Start rolling from the value shown at `now` to `target`. */
  to(target: number, now: number): void;
  /** Jump straight to `value` (no roll). */
  set(value: number): void;
  /** Whole number to show at `now`. */
  value(now: number): number;
  /** Has it reached its target by `now`? */
  done(now: number): boolean;
}

export function createCountUp(initial: number): CountUp {
  let from = initial;
  let target = initial;
  let start = 0;
  let duration = 0;

  const progress = (now: number) => (duration <= 0 ? 1 : Math.min(1, Math.max(0, (now - start) / duration)));

  const api: CountUp = {
    to(next, now) {
      from = api.value(now);
      target = next;
      start = now;
      duration = Math.min(MAX_MS, MIN_MS + Math.abs(next - from) * MS_PER_POINT);
    },
    set(value) {
      from = target = value;
      duration = 0;
    },
    value(now) {
      const t = progress(now);
      if (t >= 1) return target;
      const eased = 1 - (1 - t) ** 3; // ease-out cubic
      return Math.round(from + (target - from) * eased);
    },
    done(now) {
      return progress(now) >= 1;
    },
  };
  return api;
}
