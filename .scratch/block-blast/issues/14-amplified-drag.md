# 14: Amplified Drag

**What to build:** Make a Drag take less effort. Today the dragged Piece tracks the finger 1:1, so reaching the top of the Board means moving the thumb the whole height of the Board. Like Block Blast, the Piece should travel further than the finger does.
- On grab, the Piece lifts above the thumb exactly as it does now (centered, 1.2 Cells above).
- From then on, the Piece moves **k×** as far as the finger has moved since the grab: the same k horizontally and vertically, constant, with no speed-based acceleration. k starts at **1.5** as a single constant next to the lift, to be tuned on the phone.
- The Piece stays fully on screen: it stops at the screen edges even if the finger keeps going.
- Only touch and stylus Drags are amplified. A mouse keeps 1:1 tracking.
- The Ghost and the landing spot follow the drawn Piece, as they do today: no "nearest spot that fits" help. Add help later only if misses are still a problem after playtesting.

**Blocked by:** 07 (Drag feel)

**Status:** resolved

- [x] The Piece's offset from where it was lifted is k × the finger's offset from where it grabbed
- [x] With k = 1 (mouse), the Piece is placed exactly as before
- [x] The Piece is clamped to the canvas, and the Ghost/landing origin comes from the clamped position
- [x] k lives in one named constant
- [x] Geometry tests cover amplification and clamping

## Comments

- Implemented on branch `ticket-14-amplified-drag`: `amplifiedTopLeft` and `clampOnScreen` in `src/input/geometry.ts` (tested), wired in `src/input/drag.ts`, `DRAG_GAIN = 1.5`.
- Human to verify on the phone: reaching the top row and the far corners takes a short thumb movement; single-Cell adjustments are still easy to control. If it feels twitchy, lower `DRAG_GAIN`; if it still feels like work, raise it.
