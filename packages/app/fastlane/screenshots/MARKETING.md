# App Store marketing assets

Audit date: 2026-10-27. App: **Budgie: Expense Tracker**, App Store Connect
`6757147597`, bundle `com.vitalyiegorov.budgie`. Submission target: **6.117.0**,
Prepare for Submission, as reported by the owner. This audit inspected repository
assets and public Apple/fastlane documentation. No authenticated store inventory,
uploads, review submissions, workflow dispatches or Mac captures were performed.
“Missing on ASC” below is the owner's report, not a verified API response.

The branch starts at `origin/main`, whose package version is already **6.117.1**.
Use `APP_STORE_VERSION=6.117.0` for every version-bound lane below. Without the
override, existing lanes retain their package-version default.

## Surface audit

| Surface | Required for this release? | Budgie status | Upload or management path |
| --- | --- | --- | --- |
| App icon | Yes | Production icon sources exist in `packages/app/assets/icons`; delivered with the binary | Build upload; not a screenshot/header upload |
| iPhone 6.9-inch screenshots | An accepted large-display source for scaling | Seven `1320x2868` images per locale, committed under `variants/dark/ios` | Existing `ios_screenshots` lane; Spaceship `APP_IPHONE_67` |
| iPhone 6.5-inch / 6.3-inch screenshots | No additional native captures needed when using Apple's scaling | Covered by the large-display set; no separate sets committed | ASC scales the supplied large images; verify Media Manager before submission |
| iPad 13-inch screenshots | Yes: `ios.supportsTablet: true` in `app.config.js` | Seven `2064x2752` images per locale, committed | Existing `ios_screenshots`; Spaceship `APP_IPAD_PRO_3GEN_129` |
| Other iPad sizes | No additional set when using scaling | Covered by the 13-inch source | ASC scaling |
| iPhone Duo screenshots | Optional now; future SDK-dependent requirement | No genuine Duo captures; macmini's documented Xcode 26.6 / iOS 26.5 cannot capture Duo | Latest fastlane source has `APP_IPHONE_DUO`; installed 2.240.1 does not. Check current Asset Library reference data and upgrade tools before capture/upload |
| Product page Header | Optional | Previously missing; this PR adds five localized universal and five wide headers | New `ios_marketing_assets` lane uploads to Asset Library using the public API; choose placement in UI |
| Search Results creative | Optional | Same five universal headers can serve this placement | Select **Use header asset in search results** for the universal PNG |
| iPhone app preview | Optional, up to three per device/localization | No production recordings in repo; this PR prepares a real capture flow and checked 20-second encoder | New `ios_app_previews` lane via deliver `app_previews_path`; manual Media Manager fallback |
| iPad app preview | Optional, independently of required screenshots | Not produced; phone footage must not be stretched into an iPad preview | Native iPad recording + `1200x1600` encoder needed if later desired; API/Media Manager |
| Asset Library | Optional reusable-asset workflow | New upload lane is ready; remote contents unverified | API reserve/upload/commit, or **Asset Library → +**; upload does not assign a placement or submit review |
| Custom Product Pages | Optional | None identified; defer audience-specific variants until launch | Public API supports CPP metadata/assets/submission; UI **Custom Product Pages** |
| Product Page Optimization | Optional; needs a live eligible app | Defer until Ready for Distribution and enough conversion traffic | API experiment/treatment resources or UI **Product Page Optimization** |
| In-App Events | Optional | Skip: no real time-limited event identified | API supports event metadata/media/submission; do not invent a launch event for an evergreen tracker |
| App promo codes | Optional | Not generated; unnecessary for completing the listing | UI **Promo Codes → Generate**; no public app promo-code generation endpoint identified |
| Featuring nomination | Optional | No nomination prepared | API nominations or UI **Featuring → Nominations**; editorial selection is separate from submission |
| Apple Ads | Optional paid acquisition | Not configured in this task | Separate Apple Ads account/API; not a deliver upload |
| Ratings/reviews, responses and marketing badges/links | Optional promotion and ongoing maintenance | No public first-release reviews assumed; no changes here | Real customer reviews, ASC responses/API and Apple's marketing tools; no generated testimonials |
| Promoted IAP/subscription art, offer codes, App Clip art, watchOS/tvOS/native macOS/visionOS screenshots | Only when shipping those products/platforms | No matching marketing deliverable requested here | Product-specific configuration; iOS-on-Mac compatibility does not itself require native Mac screenshots |
| Listing copy, promotional text, release notes, privacy/category/age rating/price/review contact | Release requirements vary by field | Owned by the two parallel PRs | Existing metadata lanes / ASC; untouched by this PR |

Apple allows 1–10 screenshots per display group. Its current page calls Dynamic
Island medium a required iPhone size, but also explicitly permits highest-resolution
sources and describes the large → Face ID large → Dynamic Island medium scaling
chain. Both existing capture devices remain in `.github/store-screenshots.config.json`;
no fabricated resizing or additional capture target is necessary for this release.
Confirm the scaled 6.3-inch well in Media Manager because Apple's terminology is
changing. See [Apple screenshot requirements and scaling](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).

Duo screenshot dimensions are `1398x2034` outer and `2007x2853` inner, with reversed
landscape equivalents. Apple's current specification says April 2027 for apps using
iOS 27.1 SDK or later. Capture real adaptive layouts with Xcode 27.1 before claiming
optimization. The older [Apple DTS rollout answer](https://developer.apple.com/forums/thread/845505)
and static [ScreenshotDisplayType reference](https://developer.apple.com/documentation/appstoreconnectapi/screenshotdisplaytype)
lag the [latest fastlane display types](https://github.com/fastlane/fastlane/blob/master/spaceship/lib/spaceship/connect_api/models/app_screenshot_set.rb).
Use the [runtime asset specification catalog](https://developer.apple.com/documentation/appstoreconnectapi/discovering-asset-specifications)
to resolve actual availability rather than assuming a web selector or enum is current.

CPPs support up to 70 pages and require approval; the current setup guide requires
Ready for Distribution in at least one territory. PPO supports up to three treatments
and requires a live eligible version. Neither blocks this first release.
See [CPP setup](https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions),
[CPP automation](https://developer.apple.com/app-store/custom-product-pages/),
[PPO eligibility](https://developer.apple.com/help/app-store-connect/create-product-page-optimization-tests/create-a-test/)
and [experiment API](https://developer.apple.com/documentation/appstoreconnectapi/app-store-version-experiments).
[In-App Events](https://developer.apple.com/app-store/in-app-events/) require a genuine
timely experience. [App promo codes](https://developer.apple.com/help/app-store-connect/offer-promo-codes/request-and-manage-promo-codes/)
are optional distribution tools, not missing artwork. [Featuring nominations](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring)
can also be [managed through the API](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-nominations).

## Reproduce the headers

```bash
bash packages/app/fastlane/screenshots/design/compose-app-store-headers.sh
magick identify packages/app/fastlane/screenshots/marketing/headers/*/*.png
```

Outputs are committed in `marketing/headers/<asc-locale>/` for `en-US`, `de-DE`,
`es-ES`, `fr-FR`, `uk`:

- `header-universal-5244x2950.png`: usable for both Header and Search Results.
- `header-3840x1646.png`: dedicated Header alternative; do not use it as Search Results art.

### Header v2: localized benefits and healthy seed data

The committed `compose-app-store-headers.sh` generates all ten files without a
simulator, network access or frame downloads. It extracts the existing framed
phone from `variants/dark/ios/<asc-locale>/01_iphone_home.png`, removing only the
connected exterior green background. It never edits the captured UI or its
numbers. These are fictional showcase fixtures: the English hero has a positive
**$91,358.63** total balance, a green **62%** budget, and **$2,871 left**. German,
Spanish and French show **63%**, and Ukrainian **59%**, all with positive balances
and money remaining. A healthy capture already exists in every locale; no
Maestro/seed change or macmini recapture is needed for these headers. Raw capture
directories are absent in this checkout, so the committed screenshot variants
are the reproducible source rather than untracked raw images.

The secondary phone uses the localized, transparent framed analytics capture in
`packages/landing/public/media/spending-analytics/<app-locale>/dark/`. Both frames
come from the existing `frame-device.sh` / mobile-ci system. The home screenshot
already bleeds off its lower edge; v2 retains that real capture boundary and
fades its lower tail into the universal background instead of inventing UI or a
missing bottom bezel. The universal hero is 1350 pixels wide; the rear phone is
2600 pixels tall and tilted 8 degrees. Together they fill the lower canvas.

The art reuses the app icon mark, FixelDisplay-Bold / FixelDisplay-SemiBold,
`#54EAA6` highlight and screenshot palette `#003B25 → #00140C`. The localized
headlines reuse PR [#1691](https://github.com/budgie-at/budgie/pull/1691)'s analytics
caption voice; the wide layout also carries its offline/no-account/no-subscription
trust message. No ASO metadata or screenshot captions are changed here.

| Locale | Headline |
| --- | --- |
| en-US | See where money goes. |
| de-DE | Verstehe deine Ausgaben. |
| es-ES | Descubre en qué gastas. |
| fr-FR | Comprenez vos dépenses. |
| uk | Знайте, куди йдуть гроші. |

### Safe areas and independent layouts

Apple's [creative specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications)
accept both exact export sizes. Both outputs are flattened 8-bit sRGB PNGs with
three RGB channels and no alpha. The wide PNG is composed independently at
3840×1646, with two headline lines, a compact brand row, one supporting line and
individually resized/repositioned phones; it is not a crop of the universal PNG.

The rectangles below were measured from the pixel-layer bounds named **Art Safe
Area** in Apple's official Photoshop templates downloaded on 2026-10-27. Bounds
use `(left, top, right, bottom)`, with exclusive right/bottom edges:

| Export | Official template | Safe rectangle | Size |
| --- | --- | --- | --- |
| Universal / Search Results | [Universal PSD](https://devimages-cdn.apple.com/design/resources/download/app-store/creative_assets-universal_asset_template-static.psd) | `(1921, 660, 3323, 1622)` | 1402×962 |
| Wide Header | [Header PSD](https://devimages-cdn.apple.com/design/resources/download/app-store/creative_assets-product_page_header_template-static.psd) | `(1097, 493, 2743, 1154)` | 1646×661 |

These are deliberately tighter than a guessed central 16:9 or 21:9 crop. As
approved for v2, **the headline, healthy balance amount and green budget card are
the critical content** kept inside these bounds. Device frames, lower account
rows, the secondary analytics phone, background glow and the universal brand
lockup extend outside and may be cropped. This preserves large devices without
shrinking the entire composition into the small universal safe rectangle.

The universal uses a 1310-pixel maximum headline width at `(1960, 1480)`, a dark
backing for contrast, and the healthy phone at `(1940, 320)`. The wide uses a
690-pixel maximum headline line width at `(1125, 670)` / `(1125, 800)` and the
healthy phone at `(1850, 270)`. Inspecting the safe-rectangle crop at 350 pixels
wide provides a conservative small-format readability check; it is a local design
check, not a claim about the precise rendered ASC viewport.

Apple's [asset guidance](https://developer.apple.com/app-store/asset-best-practices/)
asks for localized, short, legible text and focal content within template safe
areas. Before approval, use [ASC Preview](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets)
for both Product Page and Search Results, iPhone/iPad, orientations and all five
languages. Confirm the headline and positive budget remain legible, and that
cropping only removes decorative device tails. This task did not access ASC,
upload assets or dispatch workflows; live placement crops remain an owner check.

## Record and encode app previews

The landing pipeline can collect real Maestro recordings: `capture_flow_cell`
already moves a flow's single MP4 beside its single PNG. The new
`app-store-preview` scene in `.github/landing-media.config.json` uses that path.
It records home/account scrolling and analytics with four deliberate swipes, after
waiting for the home UI. It does not restart the app or alter app behavior.

The canonical mobile-ci `scripts/media/compose-web-clips.sh` at `v4.4.1` defaults
to 8 seconds, width 900, 24 fps, CRF 28 and no audio. Its web byte budgets and
aspect-derived height make it unsuitable as the final store encoder. The new
`compose-app-store-preview.sh` consumes the same raw MP4, without device frames,
and creates `01_IPHONE_67.mp4` at exactly **886x1920**, **20 seconds**, **30 fps**,
progressive **H.264 High Level 4.0**, yuv420p, 10 Mbps target / 12 Mbps maximum,
with a silent stereo AAC 256 kbps / 48 kHz track and fast-start metadata. It checks
the result with ffprobe and rejects short recordings or unexpected input sizes.
The minute source-aspect difference is center-cropped after proportional scaling,
never stretched. Generated MP4s stay gitignored, following existing video conventions.

Apple accepts 15–30 seconds, at most 500 MB, H.264 MP4/MOV/M4V, at most 30 fps,
with AAC stereo. Modern iPhone groups use `886x1920` portrait / `1920x886`
landscape; 13-inch iPad uses `1200x1600` / `1600x1200`. Older iPhone slots also
include `1080x1920` and `750x1334`; older iPad slots include `900x1200`.
No phone preview is offered as a native iPad preview. Processing can take up to
24 hours. See [Apple app preview specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/).

On **macmini**, from the current branch synced to `~/budgie-runway`, with a current
E2E app already installed on the capture simulator:

```bash
export PATH="/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"
cd ~/budgie-runway
df -h /System/Volumes/Data
bash tests/app-tests/scripts/capture-store-screenshots.sh \
  --config .github/landing-media.config.json \
  --device 'iPhone 17 Pro Max' --locales en,fr,uk,de,es --appearances dark \
  --scenes app-store-preview --skip-install \
  --output packages/app/fastlane/screenshots/landing-raw
```

If the installed E2E binary is stale, build it using `tests/app-tests/E2E-RUNBOOK.md`
and replace `--skip-install` with `--app <absolute-current-E2E-app-path>`. The capture
runner owns boot → slim → install/drive → shutdown and seeds showcase fixtures for
each locale. It requires `simslim`, Maestro, jq and sqlite3. Do not use macstudio.
A partial capture replaces that device's raw tree; copy any wanted earlier captures
elsewhere first. No Mac flow execution is claimed by this PR.

On Linux, from this repository:

```bash
mkdir -p /tmp/budgie-app-preview
scp -r macmini:~/budgie-runway/packages/app/fastlane/screenshots/landing-raw/raw /tmp/budgie-app-preview/
for mapping in en-US:en fr-FR:fr uk:uk de-DE:de es-ES:es; do
    bash packages/app/fastlane/screenshots/design/compose-app-store-preview.sh \
        "/tmp/budgie-app-preview/raw/ios/iphone-17-pro-max/${mapping#*:}/dark/app-store-preview.mp4" \
        "packages/app/fastlane/screenshots/marketing/previews/${mapping%:*}"
done
```

Watch every encoded clip; check for permission overlays, UI settling, clean cuts,
localized showcase data and the default five-second poster. These remain real
capture acceptance steps, separate from synthetic encoder validation.

## Upload paths — owner action only

The commands below write to ASC. This PR did **not** run them. They reuse
`asc_api_key_settings` and need an API key whose role/app access permits the
operation. Existing credential resolution remains in the Fastlane README.

```bash
cd packages/app
APP_STORE_VERSION=6.117.0 fastlane store_preflight
fastlane ios ios_marketing_assets
APP_STORE_VERSION=6.117.0 fastlane ios ios_screenshots
APP_STORE_VERSION=6.117.0 fastlane ios ios_app_previews
```

`ios_marketing_assets` uses Spaceship's authenticated raw client and FileUploader:
read the app's library and current image catalog, reserve `CREATIVE_ASSETS` images,
upload the returned operations, then commit with `uploaded: true`. It does not use
the legacy screenshot checksum field. Content-derived reference names prevent
re-uploading completed copies; an unfinished/rejected/archived existing reservation
fails with its asset ID for inspection instead of silently claiming success.
It uploads both sizes and leaves processing, placement and review to the owner.
See [Apple image upload lifecycle](https://developer.apple.com/documentation/appstoreconnectapi/uploading-and-managing-image-assets)
and [placement API](https://developer.apple.com/documentation/appstoreconnectapi/placing-assets-on-your-app-store-surfaces).

`ios_app_previews` inspects all five encoded files with ffprobe before authenticating,
checks the expected editable version, and requires a fastlane version exposing
`app_previews_path` (verified locally with 2.240.1). It skips binary, metadata,
screenshots, precheck and submission; it preserves existing previews and lets
deliver deduplicate. A header or MP4 is never put under the screenshot tree.
The existing screenshot CI upload command is unchanged.

Manual UI alternative and remaining owner steps:

1. Open [Budgie in App Store Connect](https://appstoreconnect.apple.com/apps/6757147597/distribution).
   Choose **iOS App 6.117.0**, and choose each of the five localizations.
2. Under **Product Page Information → Header and Search Results → Header**, drag
   `marketing/headers/<locale>/header-universal-5244x2950.png` into the well, or
   choose **Browse Assets** after the upload lane has processed it. Select
   **Use header asset in search results**. The wide alternative is header-only;
   using it requires selecting the universal file separately under Search Results.
3. Use **Preview** for iPhone, iPad, orientations and languages. Confirm clipping
   and legibility. In **Asset Library**, inspect processing/Works With; upload by
   **+ → Upload Creative Assets** if not using the lane. Approval and placement
   are separate; standalone library assets can be submitted separately.
4. Under **App Previews and Screenshots → View All Sizes in Media Manager**, check
   the seven 6.9-inch and seven 13-inch iPad screenshots per locale, their order,
   and smaller-device scaling. Upload the existing sets if missing. Do not upload
   all 14 images to one device well.
5. Run the macmini capture and Linux encoder commands above. Review every clip,
   then use `ios_app_previews`, or drag each
   `marketing/previews/<locale>/01_IPHONE_67.mp4` into the 6.9-inch preview well.
   Allow processing and choose a strong poster with **Edit Poster Frame**.
6. Save and include the chosen creative placements/previews with the intended
   6.117.0 review submission once the separate copy and release-metadata PRs are
   ready. A live release is needed before pursuing CPP/PPO; these optional tools,
   promo codes and a fabricated In-App Event are not first-release blockers.
7. Later, after upgrading macmini/Xcode and validating actual adaptive layouts,
   capture Duo outer/inner screenshots and query Apple's current catalog before
   adding that device to the capture/compose pipeline. Do not stretch current
   iPhone screenshots or claim a Duo optimization badge now.

Apple documents the UI paths, independent asset review and placements in
[Manage your App Store assets](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets).

## Validation

The implementation was checked with `pnpm format`, `pnpm ts`, `pnpm lint`,
`pnpm deadcode`, `pnpm cpd`, `pnpm effect:check`, Ruby/Bash syntax checks and
`APP_STORE_VERSION=6.117.0 fastlane store_preflight`. The existing
`test-compose-screenshots.sh`, `test-compose-web-media.sh` and
`test-capture-store-screenshots.sh` scripts passed. The web composition check used
a temporary official libwebp 1.6.0 CLI because this host lacked `cwebp`.

ImageMagick and PNG-header inspection verified all ten sizes, RGB color type and
8-bit channels; a second generation matched every file byte for byte. All 70
existing store screenshots retain their two expected dimensions. A temporary
synthetic recording verified the encoder's delivery format and rejection of a
short input; it is not a production preview and is not committed. Offline mock
checks verified ten header reservations/uploads/commits, idempotent re-runs,
catalog rejection, preview validation and the version override. Live API behavior,
App Review acceptance and the macmini recording remain unverified.

Header v2 re-ran the six required repository gates, `pnpm build`,
`pnpm test --concurrency=2`, `pnpm i18n:check`, selector/shard validation, Bash syntax, metadata budgets,
store preflight and the existing composition/capture self-tests. ImageMagick
`identify` and PNG IHDR inspection confirmed all ten exact dimensions and 8-bit
RGB without alpha; regenerating the final set matched all ten SHA-256 hashes.
All five universal and wide safe-area crops were visually inspected, including
small-format headline readability and the Ukrainian glyphs. Existing store
screenshots and their fictional seed values are unchanged.
