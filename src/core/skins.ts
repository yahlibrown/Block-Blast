// Skin unlocks and Lifetime Points. Which Skins exist and their thresholds come
// from TUNING.skins; how a Skin looks is the renderer's business.
import { TUNING } from "../tuning/tuning";

export type SkinId = keyof typeof TUNING.skins.thresholds;

export interface SkinUnlock {
  readonly id: SkinId;
  /** Lifetime Points (plus the current Run's score) that unlock it. */
  readonly threshold: number;
}

/** Every Skin, by rising threshold. The first is unlocked from the start. */
export const SKINS: readonly SkinUnlock[] = (
  Object.entries(TUNING.skins.thresholds) as [SkinId, number][]
)
  .map(([id, threshold]) => ({ id, threshold }))
  .sort((a, b) => a.threshold - b.threshold);

/** The long-term progress a Run starts from and hands on to the next. */
export interface Profile {
  /** Best Score. */
  readonly best: number;
  /** Lifetime Points: the sum of every finished Run's final score. */
  readonly lifetime: number;
  /** Unlocked Skins, in catalogue order. */
  readonly unlocked: readonly SkinId[];
}

export function isSkinId(v: unknown): v is SkinId {
  return SKINS.some((s) => s.id === v);
}

/**
 * The unlocked set, in catalogue order: the first Skin, every known id in `ids`
 * (unknown ids are dropped) and every Skin `points` already reach.
 */
export function unlockedSkins(ids: readonly unknown[], points: number): SkinId[] {
  return SKINS.filter((s, i) => i === 0 || ids.includes(s.id) || s.threshold <= points).map((s) => s.id);
}

/** Skins not yet in `unlocked` that `points` reach, by rising threshold. */
export function newUnlocks(unlocked: readonly SkinId[], points: number): SkinId[] {
  return SKINS.filter((s) => !unlocked.includes(s.id) && s.threshold <= points).map((s) => s.id);
}
