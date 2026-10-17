// Palette Shift level: how many tuned score thresholds this Run has passed.
import { TUNING } from "../tuning/tuning";

/** The Palette Shift level a Run with this score has reached. */
export function paletteLevelFor(score: number): number {
  return Math.floor(score / TUNING.palette.shiftEvery);
}
