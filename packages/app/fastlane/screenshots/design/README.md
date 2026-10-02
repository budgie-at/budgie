# Screenshot design system

`compose-screenshots.sh` turns a raw simulator capture into a store image:
a variant-palette canvas, a real device frame, a soft drop shadow, and a
two-tier caption stack. Output is always the **exact pixel size of the raw
capture**, because `deliver` assigns App Store Connect device slots by matching
the uploaded file's dimensions.

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

## Typography

`CAPTION_FONT` defaults to `packages/app/assets/fonts/FixelDisplay-Bold.ttf` —
the app's own display face. It is in-repo, so it renders identically on macOS
and on Linux without depending on either OS's installed font set, and it covers
Latin, Latin-accented and Cyrillic, which is exactly the script coverage the
five store locales need. Passing a TTF path rather than a font *name* also
sidesteps ImageMagick's platform-specific font lookup.

The headline point size targets 10% of an *effective width*: the canvas width
for a canvas at the iPhone's aspect, or the canvas height rescaled to that
reference aspect when the canvas is proportionally wider (the iPad). Both
devices are then calibrated to the same proportion of their own vertical budget
instead of the iPad headline swallowing its shallower band.

From there the size shrinks in 4px steps until the headline fits 90% of the
canvas width, never below 55% of the starting size. A headline that still
overflows at that floor is scaled down with a `note:` on stderr — that note
means the copy should be shortened, not that the layout is fine.

Descriptors render at 55% of the headline size and 75% opacity, and **wrap**
inside the caption width rather than shrinking, so a long descriptor grows the
caption stack and pushes the device down.

## Layout

Two variants alternate by position for scroll rhythm:

- **A** — caption at the top edge margin, device immediately below it.
- **B** — device at the top edge margin, caption immediately below it.

Both place the device relative to the caption stack's *actual rendered height*
plus one fixed gap, rather than anchoring text and device to opposite canvas
edges and letting whatever is left over become the gap — that is what makes the
composition read as one unit instead of two islands.

The first and last shot of each device's run use the taller end of the device
height range (0.78 of canvas height); every other shot uses 0.74.

## Palette

Both palettes are the app's own tokens from `src/global.css`, as a near-flat
top-to-bottom tone shift rather than a solid fill — flat at a glance, but not a
dead swatch next to the device shadow.

| Variant | Canvas              | Text      |
| ------- | ------------------- | --------- |
| light   | `#F8F8F8`→`#F1F1F1` | `#0A0A0A` |
| dark    | `#141414`→`#0A0A0A` | `#F5F5F5` |

## Captions

`<asc-locale>/title.strings` and `<asc-locale>/subtitle.strings`, keyed by scene
name, in `"key" = "value";` format. Copy uses the app's own translated
vocabulary (Ausgabe, Dépense, Витрата, Gasto) so the caption and the screenshot
under it speak the same language.

Keep headlines under roughly 22 characters. They are set as a single unwrapped
line, so a long one is set small rather than clipped, and a set of headlines
that vary wildly in size reads as an accident rather than a system.
