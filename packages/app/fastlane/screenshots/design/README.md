# Screenshot design system

`compose-screenshots.sh` turns a raw simulator capture into a store image:
a deep brand-colour canvas, a two-line headline with one highlighted phrase, a
second line, and a real device frame that bleeds off the bottom edge. Output
is always the **exact pixel size of the raw capture**, because `deliver`
assigns App Store Connect device slots by matching the uploaded file's
dimensions.

## Framing

The frames are fastlane frameit's own assets (Apple Design Resources via
facebook/design), cached at `~/.fastlane/frameit/latest`. frameit's own
`run`/`ios` commands letterbox every capture into one fixed canvas, so its
pipeline cannot be used unmodified; this script borrows the frame PNGs instead.

| Capture              | Frame asset                                              | Frame canvas | Screen cutout          |
| -------------------- | -------------------------------------------------------- | ------------ | ---------------------- |
| iPhone 1320x2868     | `Apple iPhone 16 Pro Max Black Titanium.png`             | 1470x3000    | `+75+66` 1320x2868     |
| iPad 2064x2752       | `Apple iPad Pro (12.9-inch) (4th generation) Space Gray.png` | 2245x2930 | `+96+102` 2048x2732    |

Both cutouts were measured directly off each PNG's alpha channel (the screen
opening is the only fully transparent region not connected to the image's outer
edge) and are asserted by the frame's own geometry: `1470-(2*75)=1320` and
`3000-(2*66)=2868`.

- **iPhone.** Apple ships no black iPhone 17 Pro Max, and the only 17 Pro Max
  frames are Cosmic Orange / Deep Blue / Silver — a fourth colour next to
  Budgie's monochrome brand. The 16 Pro Max Black Titanium frame carries the
  identical panel geometry, so the cutout is an exact 1320x2868 pixel match for
  the 6.9" capture and nothing is resized.
- **iPad.** The 13" M4 iPad Pro is not in frameit-frames yet. The 12.9" iPad Pro
  (4th generation) is the closest match: same edge-to-edge Face ID design with
  no home button, same 4:3 panel. Its 2048x2732 cutout is resized ~0.8% to the
  2064x2752 capture; the aspect ratio matches to 0.05%, so the resize is
  imperceptible and never crops.

The capture is clipped to the frame's *enclosed* opening rather than the cutout
rectangle: the rectangle's corners overlap the frame's transparent outer corner
region (the device's outer radius is larger than the screen's), so a square
capture would otherwise poke past the bezel at all four corners. Flood-filling
the border-connected transparent region out of the alpha mask and intersecting
with the cutout rectangle leaves only the screen opening.

## Story

Eight slides per device, in store order. The output filename sets the order;
the scene name is the raw capture it is built from.

| Slot | Scene            | Message                                                  |
| ---- | ---------------- | -------------------------------------------------------- |
| 1    | `01-home`        | Net worth across currencies, budget card at ~65%         |
| 2    | `05-add-expense` | One tap on the pattern suggestion fills category and sum |
| 3    | `03-analytics`   | Last calendar month, full of categories and income       |
| 4    | `04-budget`      | Category limits, a mix of green and amber                |
| 5    | `08-widgets`     | Net worth and budget widgets on the Home Screen          |
| 6    | `09-inbox`       | Categorize inbox with history-based suggestions          |
| 7    | `06-account`     | Home scrolled to crypto, deposits and debts              |
| 8    | `07-settings`    | Privacy and security, screenshot protection on           |

The first three slides carry the pitch on their own, because a search result
shows only those.

## Layout

Every slide is text-top: the caption stack starts at 5.2% of the canvas
height, and the device starts 3% of the height below the stack's rendered
bottom, so the gap stays fixed whatever the copy length. The device is sized by
width (80% of the canvas, 92% on slot 1 and 88% on the iPad's slot 1) and is
allowed to run past the bottom edge, so the screen reads larger than a fully
framed device would.

Slot 5 is the only tilted slide (-5°), to set the Home Screen apart from the
in-app screens.

## Typography

`CAPTION_FONT` defaults to `packages/app/assets/fonts/FixelDisplay-Bold.ttf`
and `SUBLINE_FONT` to `FixelDisplay-SemiBold.ttf`, the app's own display face.
Both are in-repo TTFs, so macOS and Linux render identically, and they cover
Latin, accented Latin and Cyrillic.

- **Headline**: 11.5% of an *effective width* (the canvas width at the
  iPhone's aspect, or the canvas height rescaled to that aspect on the wider
  iPad), -0.025em tracking, 1.02 leading, white. `\n` in the copy breaks the
  line (two lines at most), and `*text*` is set in the highlight colour. A line
  wider than 88% of the canvas shrinks the whole headline in 4px steps, never
  below 72% of the starting size; a headline still too wide at that floor is
  scaled down with a `note:` on stderr, which means the copy needs shortening.
- **Second line**: 70% of the headline size at 92% white, wrapped inside the
  caption width and then narrowed to the tightest width that keeps the same
  line count, so the lines come out balanced instead of leaving an orphan.
  Keep it to two lines.
- **Chips**: an optional row of pills under the second line, 33% of the
  headline size, from `chips.strings`. Only slot 1 has them.

## Palette

The canvas uses the landing site's privacy pillar (`--privacy`,
`oklch(0.52 0.12 163)`), the one brand colour that carries Budgie's offline and
private positioning. Each slide shifts the hue a few degrees around 163, so the
set reads as one family with some movement when scrolled.

| Element   | Value                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Canvas    | vertical gradient, `oklch(0.31 0.072 h)` to `oklch(0.17 0.038 h+4)`      |
| Glow      | radial `oklch(0.50 0.115 h)` at 55% behind the device's top third        |
| Headline  | `#FFFFFF`, highlight `#54EAA6` (`--privacy` in the landing's dark theme) |
| Chip      | `#54EAA6` at 10% fill, 60% stroke, `#DFFBEE` text                        |
| Shadow    | black at 45%, blur 1.6% of the canvas height, offset 1.2%                |

The canvas does not depend on the appearance: the light and dark sets differ
only in the app UI inside the device. `deployed-variant.json` ships the dark
set.

## Captions

`<asc-locale>/title.strings`, `subtitle.strings` and `chips.strings`, keyed by
scene name, in `"key" = "value";` format. Each locale is written for that
market rather than translated, uses the app's own vocabulary (Ausgabe, Dépense,
Витрата, Gasto, the app's Reichweite/Autonomía/Autonomie/Запас for runway) and
never claims bank sync. Keep each headline line to about 14 characters so the
set stays at one type size; `compose-screenshots.sh` prints a `note:` when one
cannot fit.
