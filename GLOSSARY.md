# Block Blast Clone

An ad-free, single-player, endless block-placement puzzle played on a phone, built to match Block Blast Classic's rules and its feel-good feedback.

## Play

**Board**:
The 8×8 grid of **Cells** that **Pieces** are placed onto.
_Avoid_: Grid, field, playfield

**Cell**:
One square of the **Board**, which is either empty or filled.
_Avoid_: Tile, square, slot

**Piece**:
A fixed shape of one or more blocks that the player places onto the **Board** as a single unit. Pieces cannot be rotated.
_Avoid_: Block (a block is one filled square of a Piece), shape, tetromino

**Tray**:
The set of up to three **Pieces** currently offered to the player. A new Tray of three is dealt only once all three have been placed.
_Avoid_: Hand, queue, rack

**Placement**:
The act of dropping one **Piece** from the **Tray** onto empty **Cells** of the **Board**.
_Avoid_: Move, drop, turn

**Drag**:
Carrying a **Piece** from the **Tray** across the **Board** before letting go; letting go where it fits makes a **Placement**, anywhere else sends it back to the **Tray**.
_Avoid_: Move, swipe, hold

**Ghost**:
A see-through copy of the dragged **Piece** on the **Board**, in the **Cells** it would fill if let go now; shown only where it fits.
_Avoid_: Shadow, preview, hint

**Snap**:
During a **Drag**, when the **Piece** doesn't fit where it is drawn, the **Ghost** moving to the nearest spot within reach where it does fit; letting go there makes the **Placement**.
_Avoid_: Magnet, assist, auto-aim

**Return**:
A **Piece** let go without making a **Placement** flying back to its **Tray** slot.
_Avoid_: Snap back, bounce

**Line**:
A full row or full column of the **Board**.

**Clear**:
The removal of every **Line** completed by a single **Placement**, all at once.
_Avoid_: Pop, blast, break

**Multi-Clear**:
A **Clear** of two or more **Lines** from a single **Placement**.
_Avoid_: Combo (a Combo is a streak across Placements)

**Combo**:
A streak of **Placements** that produce **Clears**. It grows by one with each Clear and breaks after three **Placements** in a row without one.
_Avoid_: Streak, chain, multi-clear

**Board Clear**:
A **Clear** that leaves every **Cell** of the **Board** empty.
_Avoid_: Perfect clear, all clear, wipe

**Praise**:
The encouraging message that pops up after a **Clear**, escalating with the size of the **Multi-Clear** and the **Combo** level (e.g. "Great!", "Amazing!").
_Avoid_: Toast, popup, compliment

**Run**:
One game, from an empty **Board** to **Game Over**.
_Avoid_: Session, round, match

**Game Over**:
The moment when no **Piece** remaining in the **Tray** fits anywhere on the **Board**.

## Progression

**Best Score**:
The highest score reached in any **Run**, kept on the device.
_Avoid_: High score, record

**Lifetime Points**:
The sum of the final scores of every **Run** ever played on the device; it is what unlocks **Skins**.
_Avoid_: Total score, XP

**Skin**:
A named visual style for the **Board** and its blocks, permanently unlocked when **Lifetime Points** reach its threshold.
_Avoid_: Theme, palette (when meaning an unlockable)

**Palette Shift**:
An automatic change of the background and glow colors during a **Run** as the score passes thresholds, layered on top of the chosen **Skin**.
_Avoid_: Skin change, level, theme
