// Scoring rules: block points, Clear points, Combo and Board Clear.
// Every number comes from TUNING.scoring.
import { TUNING } from "../tuning/tuning";

const RULES = TUNING.scoring;

/** Block points for a Placement of `blocks` blocks. */
export function blockPoints(blocks: number): number {
  return blocks * RULES.pointsPerBlock;
}

/**
 * Clear points (before the Combo multiplier) for clearing `lines` Lines at once.
 * Looked up in the tuning table; beyond it each step grows by the table's last
 * step growth (10, 30, 60, 100 → steps 20, 30, 40 → next steps 50, 60, …).
 */
export function clearPoints(lines: number): number {
  const table: readonly number[] = RULES.clearPoints;
  if (lines <= 0) return 0;
  if (lines <= table.length) return table[lines - 1]!;
  const n = table.length;
  const lastStep = n >= 2 ? table[n - 1]! - table[n - 2]! : table[0]!;
  const growth = n >= 3 ? lastStep - (table[n - 2]! - table[n - 3]!) : 0;
  let points = table[n - 1]!;
  let step = lastStep;
  for (let i = n; i < lines; i++) {
    step += growth;
    points += step;
  }
  return points;
}

export interface ComboStep {
  /** Combo level after this Placement. */
  readonly combo: number;
  /** Dry count after this Placement. */
  readonly dry: number;
  /** The Combo level that was lost, if this Placement broke the Combo. */
  readonly broke: number | null;
}

/** Advance the Combo for one Placement that did (or didn't) Clear. */
export function stepCombo(combo: number, dry: number, cleared: boolean): ComboStep {
  if (cleared) return { combo: combo + 1, dry: 0, broke: null };
  const nextDry = dry + 1;
  if (nextDry >= RULES.comboBreakDry) {
    return { combo: 0, dry: 0, broke: combo > 0 ? combo : null };
  }
  return { combo, dry: nextDry, broke: null };
}

export const BOARD_CLEAR_BONUS: number = RULES.boardClearBonus;
