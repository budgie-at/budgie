# Landing media flows

Capture-only Maestro flows for the landing site's motion assets. They are **not** part
of the E2E suite: `config.yaml` globs `flows/*.flow.yaml`, which is one directory level
up and does not descend into `media/`, and `scripts/validate-shards.sh` only enumerates
top-level flows. Nothing here changes app behaviour, and no flow adds a `launchApp`,
`stopApp` or relaunch — the recording runner owns the cold start for every cell.

## Layout

| File | Purpose |
| --- | --- |
| `<name>.flow.yaml` | 32 scene flows — the app states a deep link alone cannot express. Each is a still scene in `.github/landing-media.config.json` and is reused by the clips. |
| `<clip>.record.flow.yaml` | 39 record wrappers, one per storyboard clip. `startRecording` -> the interaction -> settle -> `stopRecording`. |
| `clip-routes.json` | Clip map: owning landing route slug, trim window, poster timestamp, aliases, encode settings and byte budgets. |

Every wrapper is parameterised by `APP_ID`, `LOCALE` and `APPEARANCE`, which the runner
passes with `-e`, and names its recording `<clip>-<locale>-<appearance>` so a stray file
is self-identifying.

### Scene flows

26 base flows:

`voice-listening`, `ai-suggestion-pills`, `ai-tag-pills`, `cross-currency-transfer`,
`csv-column-mapper`, `erste-pdf-preview`, `privatbank-xlsx-preview`, `category-form`,
`category-form-translation`, `export-share`, `date-filter`, `bank-token-entry`,
`pin-locked-cold-open`, `analytics-drilldown`, `analytics-tags-tab`,
`transactions-recurring-tab`, `long-press-menu`, `tags-selector-open`,
`uncategorized-pill`, `net-worth-drilldown`, `split-entries`, `consolidation-review`,
`resync-window-picker`, `transaction-fee-sheet`, `convert-to-refund-picker`,
`language-selector`

6 continuation scenes. mobile-ci's capture action collects **exactly one**
`takeScreenshot` per flow cell, so a storyboard scene that is "the same flow, one step
further" cannot be a second screenshot inside the base flow — it is its own flow that
composes the base one:

| Flow | Scene | Continues |
| --- | --- | --- |
| `voice-review` | `voice-transaction-entry-2` | `voice-listening` |
| `ai-history-suggestions` | `ai-transaction-suggestions-1` | stands alone — the pills are shown with nothing typed, which `ai-suggestion-pills` cannot do |
| `uncategorized-cleanup-page` | `uncategorized-transactions-2` | `uncategorized-pill` |
| `recurring-day-detail` | `recurring-payments-calendar-2` | `transactions-recurring-tab` |
| `analytics-untagged-drilldown` | `tag-analytics-1` | `analytics-tags-tab` |
| `convert-to-transfer-picker` | `convert-to-transfer-1` | `long-press-menu` |

Splitting those out moved the trailing step of `uncategorized-pill`,
`transactions-recurring-tab` and `long-press-menu` into the continuation flow, so their
own scene shows the state the storyboard actually asks for (the pill with its count, the
month grid, the context menu) instead of the state after it. The `uncategorized-cleanup`,
`recurring-calendar` and `long-press-menu` clips therefore run the continuation flow, so
no clip lost a beat.

### Capture-mode switch

Every scene flow ends in:

```yaml
- runFlow:
      when:
          true: ${IS_COMPOSED != 'true'}
      commands:
          - takeScreenshot: ${SCENE_ID}
```

Run on its own — which is how the capture action invokes it — the flow emits the single
screenshot the cell requires, named by its `SCENE_ID` default. Every caller that composes
it (a record wrapper, or a continuation scene) passes `IS_COMPOSED: 'true'`, so a
composed still cell still emits exactly one screenshot and a recording emits none.
`scripts/test-record-media-clips.sh` resolves the whole `runFlow` graph and asserts both.

## Record

```bash
bash tests/app-tests/scripts/record-media-clips.sh \
    --udid <simulator-udid> \
    --app packages/app/ios/build/Build/Products/Release-iphonesimulator/budgie.app \
    --locales en,uk --appearances light,dark --clips theme-toggle,pin-unlock
```

Per cell (`clip x locale x appearance`) it repeats the store capture runner's sequence:
terminate -> `seed-screenshot-scene.sh` with `SCENE=<clip-id>` -> `simctl ui appearance`
-> `simctl launch` with the locale args -> `maestro test <clip>.record.flow.yaml` ->
collect the single `.mp4`. Failed cells retry once; a failed seed and a wrapper that
recorded nothing are terminal.

Raw output (gitignored, re-recordable):

```text
packages/landing/public/media-src/clips/<clip>/<locale>/<appearance>/raw.mp4
```

Locales, appearances and the clip list are read from `.github/landing-media.config.json`
when it exists. That file is owned by the landing manifest work and lands separately, so
the runner tolerates its absence and takes everything from CLI flags instead. Use
`--dry-run` to print the resolved plan, and `--skip-prime` on a simulator that has
already granted the `budgie://` trust alert.

## Encode

```bash
bash tests/app-tests/scripts/encode-media-clips.sh --clips theme-toggle
```

Per cell: trim to the storyboard duration, lanczos downscale to 900px wide
(`--no-scale` keeps the capture resolution), crossfade the last 150 ms into the first so
the loop has no visible seam (`--loop-crossfade 0` disables), then encode

- **WebM** — AV1 (`libsvtav1`, CRF 34); `--vp9` forces the VP9 build, and an ffmpeg
  without `libsvtav1` falls back to VP9 on its own,
- **MP4** — `libx264 -profile:v high -pix_fmt yuv420p -movflags +faststart`,
- **WebP poster** — one frame at the clip's `posterSeconds`,
- **animated WebP** — only for clips marked `animatedWebp` (sub-2s, where a `<video>`
  element costs more than the frames).

Byte budgets are enforced per output (WebM 1.2 MB, MP4 1.8 MB, poster 60 KB);
`--allow-oversize` downgrades an overrun to a warning.

**GIF is never produced.** 5-10x the bytes of the same VP9 clip, a 256-colour palette
that bands Budgie's gradients, and unpausable under `prefers-reduced-motion`.

Delivery output:

```text
packages/landing/public/media/<route-slug>/<locale>/<theme>/<clip>.{webm,mp4,webp}
```

A clip is encoded once under its **owning** route slug; other pages reuse it through the
landing manifest's `aliases`, never by re-encoding.

## Re-trim a single clip

Edit `durationSeconds` / `trimStartSeconds` / `posterSeconds` in `clip-routes.json` and
re-run the encoder for that clip only — the raw recording does not need to be recaptured:

```bash
bash tests/app-tests/scripts/encode-media-clips.sh --clips analytics-period --locales en
```

## Self-tests

```bash
bash tests/app-tests/scripts/test-record-media-clips.sh
bash tests/app-tests/scripts/test-encode-media-clips.sh
```

Both run offline on Linux (`xcrun`, `maestro` and the seed hook are stubbed; the encode
round trip uses a synthetic ffmpeg-generated clip and skips when ffmpeg is missing) and
are picked up by `pr.yml`'s `E2E script self-tests` job.

## Selector follow-ups

These flows use `testID` and text selectors only — no coordinates. Where a control the
storyboard calls for carries no stable `testID`, the flow stops at the last
selector-addressable state and carries a `FOLLOW-UP` comment naming the selector that
has to be added app-side first. Adding them is out of scope here (no app-code changes).

| Surface | Missing selectors | Blocks |
| --- | --- | --- |
| Voice entry | `CreateTransactionMenuSelector.AiButton`, `VoiceInputOverlaySelector.{Container,RecordButton,Waveform,Transcript}`, `VoiceReviewSelector.{Page,Amount,Category,Account,SaveButton}` | `voice-listening`, `voice-review`, `voice-entry` |
| AI suggestion pills | `SuggestionPillSelector.{Row,Pill}` | `ai-suggestion-pills`, `ai-history-suggestions`, `ai-tag-pills`, `ai-category-suggestion` |
| CSV column mapper | `ImportColumnMapperSelector.{Page,Field,Option,PreviewRow,DecimalSeparator,DateFormat,PresetNameInput}` | `csv-column-mapper`, `csv-import` |
| AI translation fields | `AiTranslationFieldsSelector.{Container,EnglishTitleInput,KeywordsInput,RegenerateButton}` | `category-form-translation`, `merchant-translation` |
| Re-sync window picker | `ResyncWindowPickerSelector.{Page,Preset,CustomRangeRow,ConfirmButton}` | `resync-window-picker`, `resync-window` |
| CSV export range | `ExportCsvSelector.{RangePicker,RangeOption,ColumnList}` | `export-share` |
| Primary tag rotation | `TransactionCardSelector.PrimaryTagBadge` | `primary-tag-rotate` |

## Locale-dependent selectors

`showcase.db`'s locale overlays translate account, tag, budget and merchant titles, and
the app translates system category names at render time, so any `testID` derived from a
title differs per locale. Flows therefore prefer id-derived selectors
(`TransactionCard.103`, `BudgetDetails.CategoryRow.11`, `BankIntegration.AccountRow.1`)
and, where only a title-derived selector exists, take it as an `env` parameter with the
English default. Non-English cells pass the translated value with `-e`. The parameters
in play are `ACCOUNT_NAME`, `CATEGORY_NAME`, `TAG_ONE`/`TAG_TWO`/`TAG_THREE`,
`CATEGORY_STATISTICS_ID`, `TAG_STATISTICS_ID`, `UNTAGGED_STATISTICS_ID`,
`MERGE_SOURCE_CATEGORY`/`MERGE_TARGET_CATEGORY` and `SHARE_SHEET_LABEL`.
