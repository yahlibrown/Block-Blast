import { describe, expect, it } from "vitest";
import { layoutGame, TOP_BAND_HEIGHT, type Insets, type Rect } from "./renderer";

const COLUMNS = 8;
/** The longest Piece is 5 Cells: it must fit in its Tray slot. */
const LONGEST_PIECE = 5;
const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Target screens, in CSS pixels, with the safe-area insets the browser reports there. */
const SCREENS: readonly { name: string; width: number; height: number; insets: Insets }[] = [
  { name: "iPhone SE, Safari tab (toolbars shown)", width: 375, height: 548, insets: NONE },
  { name: "iPhone SE, Safari tab (toolbars collapsed)", width: 375, height: 628, insets: NONE },
  { name: "iPhone SE, Home Screen app", width: 375, height: 667, insets: { ...NONE, top: 20 } },
  { name: "iPhone 16, Safari tab (toolbars shown)", width: 393, height: 659, insets: NONE },
  { name: "iPhone 16, Safari tab (toolbars collapsed)", width: 393, height: 793, insets: { ...NONE, bottom: 34 } },
  { name: "iPhone 16, Home Screen app", width: 393, height: 852, insets: { ...NONE, top: 59, bottom: 34 } },
  { name: "iPhone 13 mini, Safari tab", width: 375, height: 629, insets: NONE },
  { name: "iPhone 16 Pro Max, Safari tab", width: 440, height: 760, insets: NONE },
  { name: "iPhone 16 Pro Max, Home Screen app", width: 440, height: 956, insets: { ...NONE, top: 62, bottom: 34 } },
  { name: "Android, Chrome tab", width: 412, height: 783, insets: NONE },
  { name: "Android, installed app", width: 412, height: 915, insets: { ...NONE, top: 24, bottom: 16 } },
];

const inside = (r: Rect, area: Rect) =>
  r.x >= area.x - 1e-9 &&
  r.y >= area.y - 1e-9 &&
  r.x + r.w <= area.x + area.w + 1e-9 &&
  r.y + r.h <= area.y + area.h + 1e-9;

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

describe("Game layout across target screens", () => {
  for (const { name, width, height, insets } of SCREENS) {
    describe(name, () => {
      const layout = layoutGame(width, height, COLUMNS, insets);
      const side = layout.board.cellSize * COLUMNS;
      const board: Rect = { x: layout.board.x, y: layout.board.y, w: side, h: side };
      const bandBottom = insets.top + TOP_BAND_HEIGHT;
      /** The space left after the top band and the safe-area insets. */
      const play: Rect = {
        x: insets.left,
        y: bandBottom,
        w: width - insets.left - insets.right,
        h: height - bandBottom - insets.bottom,
      };
      const topBand: Rect = { x: 0, y: 0, w: width, h: bandBottom };

      it("puts the Board and all three Tray slots inside the play space", () => {
        expect(inside(board, play)).toBe(true);
        expect(layout.traySlots).toHaveLength(3);
        for (const slot of layout.traySlots) expect(inside(slot, play)).toBe(true);
      });

      it("never overlaps the top band, or the Board with the Tray, or two Tray slots", () => {
        for (const r of [board, ...layout.traySlots]) expect(overlap(r, topBand)).toBe(false);
        for (const slot of layout.traySlots) expect(overlap(board, slot)).toBe(false);
        const [a, b, c] = layout.traySlots as [Rect, Rect, Rect];
        expect(overlap(a, b) || overlap(b, c) || overlap(a, c)).toBe(false);
      });

      it("keeps the Board centered across the screen", () => {
        expect(board.x + side / 2).toBeCloseTo(width / 2, 6);
      });

      it("fits the longest Piece in each Tray slot", () => {
        for (const slot of layout.traySlots) {
          expect(LONGEST_PIECE * layout.trayCellSize).toBeLessThanOrEqual(Math.min(slot.w, slot.h));
        }
      });

      it("uses most of the screen width for the Board", () => {
        expect(side).toBeGreaterThan(play.w * 0.7);
      });
    });
  }

  it("moves the Board and Tray clear of a toolbar that grows mid-Run", () => {
    // iPhone 16 Safari tab: toolbars collapsed, then shown again (the visible viewport shrinks).
    const collapsed = layoutGame(393, 793, COLUMNS, { ...NONE, bottom: 34 });
    const shown = layoutGame(393, 659, COLUMNS, NONE);
    for (const layout of [collapsed, shown]) {
      const bottom = Math.max(...layout.traySlots.map((s) => s.y + s.h));
      expect(bottom).toBeLessThanOrEqual(layout === shown ? 659 : 793 - 34);
    }
  });

  describe("spare height on tall screens (iPhone ticket 12)", () => {
    /** Gaps (CSS px): above the top band, band to Board, Board to Tray, and below the Tray. */
    const gaps = (width: number, height: number, insets: Insets) => {
      const layout = layoutGame(width, height, COLUMNS, insets);
      const boardBottom = layout.board.y + layout.board.cellSize * COLUMNS;
      const tray = layout.traySlots[0]!;
      return {
        layout,
        aboveBand: layout.bandTop - insets.top,
        bandToBoard: layout.board.y - (layout.bandTop + TOP_BAND_HEIGHT),
        boardToTray: tray.y - boardBottom,
        belowTray: height - insets.bottom - (tray.y + tray.h),
      };
    };

    it("centers the top band, Board and Tray as one block", () => {
      // iPhone 16 and Pro Max Home Screen apps: the Board is width-bound, so height is spare.
      for (const [w, h, insets] of [
        [393, 852, { ...NONE, top: 59, bottom: 34 }],
        [440, 956, { ...NONE, top: 62, bottom: 34 }],
      ] as const) {
        const { aboveBand, bandToBoard, boardToTray, belowTray } = gaps(w, h, insets);
        expect(aboveBand).toBeGreaterThan(0);
        // Board and Tray stay as close as on a short screen: one margin apart, one margin under the band.
        expect(bandToBoard).toBeCloseTo(boardToTray, 6);
        // Equal space above and below the block (the block ends one margin below the Tray).
        expect(belowTray - boardToTray).toBeCloseTo(aboveBand, 6);
      }
    });

    it("keeps the top band at the top on short screens", () => {
      // iPhone SE Safari tab with toolbars: height-bound, no spare.
      const { layout, aboveBand, bandToBoard, belowTray } = gaps(375, 548, NONE);
      expect(layout.bandTop).toBe(0);
      expect(aboveBand).toBe(0);
      expect(bandToBoard).toBeCloseTo(belowTray, 6);
    });
  });

  it("defaults to no safe-area insets", () => {
    expect(layoutGame(393, 659, COLUMNS)).toEqual(layoutGame(393, 659, COLUMNS, NONE));
  });
});
