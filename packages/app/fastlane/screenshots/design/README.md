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

## Landing media (web variant)

`compose-web-media.sh` is the web sibling of `compose-screenshots.sh`. Both
source `frame-device.sh` for the frameit cache lookup, the two device frame
geometries, the ASC → app locale mapping and the capture-into-cutout step, so
the frame is identical in both sets and neither script carries its own copy.
Everything after the frame differs:

| | `compose-screenshots.sh` (store) | `compose-web-media.sh` (landing) |
| --- | --- | --- |
| Background | opaque palette plate | **transparent** — the landing supplies its own gradient |
| Caption | burned-in headline + descriptor | **none** — the landing renders copy in HTML so it stays translatable and indexable |
| Drop shadow | soft, baked in | **none** — CSS owns it |
| Size | exact capture size | exact capture size |
| Output | `variants/<appearance>/ios/<asc-locale>/*.png` | `packages/landing/public/media/<group>/<locale>/<theme>/<scene>@2x.png` |

```bash
pnpm media:capture     # capture the landing manifest into fastlane/screenshots/landing-raw
pnpm media:compose     # frame + stage the PNGs into packages/landing/public/media
pnpm media:encode      # PNG -> AVIF + WebP at @2x, under the byte budgets
```

`--frame raw` skips the device frame and emits the capture at its own size with
an optional rounded-corner alpha mask (`--radius auto|0|<px>`), for the cropped
close-ups the landing insets into copy.

### Capture manifest

`.github/landing-media.config.json` is a sibling of
`.github/store-screenshots.config.json` in the same mobile-ci
`store-screenshots` schema: same `ios-target`, `seed-command`, `maestro-config`,
`build-env` and `cache-profile`, `status-bar-override: true`, all 5 landing
locales in light and dark on iPhone 17 Pro Max and iPad Pro 13-inch (M4). It
carries **no** `apple-screenshot-slots`, `upload-command` or `asc-*` key —
nothing here goes to App Store Connect — and its `screenshots-download-dir`
points at `fastlane/screenshots/landing-raw` so a landing run can never
overwrite the store's `raw/`.

There is no forked capture runner: `capture-store-screenshots.sh` already takes
`--config` and `--output`, which is all `pnpm media:capture` passes.

Three details are worth knowing before editing the manifest:

- **`screenshots-dir` stays `tests/app-tests`.** In `direct` mode that key is
  the root flow-backed scenes resolve against, not an output directory. The
  output root is the runner's `--output`.
- **A flow cell must emit exactly one `takeScreenshot`.** Two scenes therefore
  cannot share one flow file, which is why the storyboard's "continuation of the
  same flow" rows each get their own flow (`voice-review`,
  `ai-history-suggestions`, `uncategorized-cleanup-page`, `recurring-day-detail`,
  `analytics-untagged-drilldown`, `convert-to-transfer-picker`) on top of the 26
  interaction flows the storyboard names.
- **`capture-scenes` has no per-device filter.** The schema is
  `additionalProperties: false` and a scene can only be narrowed by `platforms`,
  `locales` and `appearances`. The five iPad scenes are therefore selected at
  capture time (`--device 'iPad Pro 13-inch (M4)' --scenes …`) and at compose
  time by the group map's `devices` field, not in the manifest.

### Scene → route slug map

`web-media-groups.json` maps each scene to the landing route slugs it feeds:

```json
"pin-app-lock-1": { "groups": ["pin-app-lock", "privacy", "security", "home"] }
```

A scene is captured once and copied into every group it lists, which is how the
storyboard's hubs and reuse rows cost zero extra capture cells, and it is why a
landing page can resolve its own media from its own route slug with no alias
table. `devices` defaults to `["iphone"]`; a scene listing `"ipad"` also
composes the iPad capture as `<scene>-ipad@2x.png`. `budget` (`hero` |
`feature`, default `feature`) picks the encode ceiling.

The map lives here rather than as a `group` field on `capture-scenes` because
mobile-ci's schema is `additionalProperties: false` on scenes; adding the field
there would fail the workflow's own allowlist.

`test-landing-media-config.sh` keeps the manifest and the map in sync: every
captured scene must be mapped, every mapped scene must be captured, every group
slug must be a real landing route, and every feature scene must publish into its
own page slug.

### Encoding and byte budgets

`encode-web-media.sh` downscales each staged PNG (900px wide for framed iPhone
shots, 1024px for iPad) and encodes AVIF + WebP with `avifenc` and `cwebp` when
they are on PATH, falling back to ImageMagick's own delegates otherwise. It is
idempotent — an asset is re-encoded only when the staged PNG is newer — prints a
size table, and exits non-zero listing every asset over its ceiling.

| Class | AVIF | WebP |
| --- | --- | --- |
| Hero still @2x | 180 KB | 288 KB (`1.6x`) |
| Feature still @2x | 120 KB | 192 KB (`1.6x`) |

Only the encoded binaries are committed; the staged PNGs and
`fastlane/screenshots/landing-raw/` are gitignored build intermediates.

### Per-scene seed overlays

Both manifests run the same `seed-screenshot-scene.sh` hook, which receives
`SCENE` alongside `LOCALE` and `APPEARANCE`. The landing scenes need showcase
states `showcase.db` does not contain (budget at 95%, multi-currency, debt,
deposit, crypto, connected bank sync, PIN enabled, …); resolving `SCENE` to
those overlays is owned by the seed issue, not by this directory. Scenes here
only have to be named exactly as the storyboard names them, because the scene id
is the key that lookup uses.

Deep links that address an overlay-seeded row by id (`budgie://account/7/details`
for the debt account, `account/8` deposit, `account/9` crypto,
`transactions/9001/expense/edit` for the MCC-synced transaction) are pinned to
the ids the overlays assign — update them here if an overlay renumbers.
