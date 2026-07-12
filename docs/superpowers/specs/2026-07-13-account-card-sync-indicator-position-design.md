# Account Card Sync Indicator Position

## Goal

Move the existing sync status circle toward the bottom-right of synchronized account cards on the home screen.

## Layout Contract

- Keep the indicator's current appearance, size, state, and behavior.
- Align its vertical center with the existing three-dot action button.
- Align it horizontally with the bottom edge of the displayed balance.
- Implement the alignment through the existing account-card layout rather than screen-size-specific absolute coordinates.
- Do not change non-synchronized cards or other home-screen elements.

## Verification

- Run formatting, TypeScript, and lint checks for the touched code.
- Relaunch Budgie Dev on the existing dedicated iPhone 17 Pro simulator.
- Visually confirm both requested alignment relationships on a synchronized account card.
