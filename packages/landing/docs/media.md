# Landing Media Contract

> Read this before adding product screenshots or motion clips to the landing, before touching
> `src/generic/component/app-shot/`, `src/generic/component/app-clip/`, `src/generic/constant/media-manifest.constant.ts`,
> or `scripts/*-media*.mjs`.

Every pixel of app UI on the landing is a real capture of the real build. Assets are produced by the capture pipeline
(epic budgie-at/budgie#694), dropped into `public/media/`, and become renderable the moment the manifest is regenerated.

---

## 1. Folder and naming contract

```text
packages/landing/public/media/<group>/<locale>/<theme>/<scene>@2x.avif
                                                      <scene>@2x.webp
                                                      <scene>.webm
                                                      <scene>.mp4
                                                      <scene>-poster@2x.webp
```

| Segment    | Values                                        | Meaning                                                                                                              |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `<group>`  | the landing route slug                        | `home`, `voice-transaction-entry`, `monobank-sync`, `privacy`, … A page resolves its media from its own slug. No path registry. |
| `<locale>` | `en`, `uk`, `fr`, `de`, `es`, `neutral`       | `neutral` is only for crops with no legible text (icon grid, PIN keypad, label-free chart crops).                     |
| `<theme>`  | `light`, `dark`                               | Both themes are mandatory. A scene with only one theme is rejected by `media:check`.                                  |
| `<scene>`  | kebab-case capture scene id                   | Matches the scene id in `.github/landing-media.config.json`.                                                          |

A **still** scene is the `@2x.avif` + `@2x.webp` pair. A **motion** scene is `.webm` + `.mp4` + `-poster@2x.webp`.
Partial sets are an error, not a silent skip. `@2x` means the file holds device pixels; the manifest records those pixel
dimensions and the components emit them as `width`/`height` so the browser reserves the right aspect ratio.

Both still variants are decoded before the scene enters the manifest: the AVIF must be a real AVIF container and the
WebP a real RIFF/WEBP one, and the two must report identical pixel dimensions. `<group>` and `<scene>` must be
kebab-case (`[a-z0-9]` with single dashes) — anything else is rejected instead of being written into the generated
manifest source.

### Byte budgets

| Asset                                  | Ceiling |
| -------------------------------------- | ------- |
| Hero still @2x (`hero`, `hero-*`)      | 180 KB  |
| Feature still @2x                      | 120 KB  |
| Motion clip, WebM                      | 1.2 MB  |
| Motion clip, MP4                       | 1.8 MB  |
| Poster @2x                             | 60 KB   |

Only final web-optimized outputs are committed. Never commit raw PNG or unencoded MP4 sources.

---

## 2. Generated manifest

`src/generic/constant/media-manifest.constant.ts` is the compile-time record of which
`group / locale / theme / scene` combinations exist on disk. It is **generated and committed**.

```bash
pnpm --filter @budgie-at/landing media:manifest   # rescan public/media, rewrite the manifest
pnpm --filter @budgie-at/landing media:check      # verify: freshness, contract, budgets, usages, orphans
```

Pages must never touch `fs`: the landing is SSG and `docs/seo-pages.md` rule 8 forbids runtime context in static routes.
The manifest is a plain typed array, so asset availability is a build-time fact and the `en` fallback is deterministic.

`media:check` runs as the first step of `pnpm --filter @budgie-at/landing build`, so a missing, oversized, orphaned or
mis-named asset fails the build (and the Vercel deploy) rather than shipping a broken `<img>`.

`media:check` fails on:

- a stale manifest (regenerating would produce a different file);
- a file that does not match the naming contract, or an unknown locale/theme folder;
- an incomplete still pair or motion triple;
- a file over its byte budget;
- an `<AppShot>` / `<AppClip>` usage that cannot resolve for one of the 5 render locales in one of the 2 themes **and**
  does not pass a `fallback`;
- an orphan asset that no `<AppShot>` / `<AppClip>` renders.

`group` and `scene` must be **literal string props** at every usage site — that is what makes the static scan possible.

---

## 3. Resolution rules

`resolveMediaAsset` (`src/generic/util/resolve-media-asset.util.ts`) takes `{ group, scene, locale, kind }` plus a theme
and walks the locale chain:

```text
requested locale  →  en  →  neutral
```

The first manifest hit wins. `en` is a build-safety net, not a coverage strategy: the capture matrix targets all 5
locales for every asset that contains app text. `neutral` catches crops that are deliberately locale-free.

Both themes must resolve. If either is missing, the component renders its `fallback` (or nothing) instead of a
half-themed pair.

---

## 4. Theme selection is class-based, not media-query based

`next-themes` runs with `attribute="class"`, `defaultTheme="system"` and `enableSystem`, so a visitor can be on light
while their OS is dark. `<picture media="(prefers-color-scheme: dark)">` would hand that visitor the dark capture.

Selection therefore follows the `.dark` class:

```html
<img class="block dark:hidden" …>   <!-- light capture -->
<img class="hidden dark:block" …>   <!-- dark capture -->
```

Zero JavaScript, no `useTheme()`, no client island, no hydration mismatch, no flash. The cost is that both variants are
in the DOM; everything below the hero is `loading="lazy"`, and a `display: none` image is not fetched eagerly.

---

## 5. Why plain `<picture>` and not `next/image`

The capture pipeline already emits final, budgeted AVIF **and** WebP at exactly the size the page renders. Routing those
through the Next image optimizer would re-encode an already-encoded file, burn Vercel image-optimization quota on every
locale × theme × scene cell (~2 600 binaries at full epic coverage), and `next/image` accepts a single `src` — it cannot
choose between two pre-encoded formats, so the hand-tuned AVIF would be discarded.

`<picture>` with `<source type="image/avif">` before `<source type="image/webp">` lets the browser pick, costs nothing at
runtime, and keeps the byte budgets in `media:check` meaningful (they measure exactly what ships).

`images: { formats: ['image/avif', 'image/webp'] }` is still set in `next.config.ts` for the images that *do* go through
`next/image` (blog cards, the hero fallback, OG art).

---

## 6. Components

Both are plain server components. Neither owns copy: `alt` is passed in by the calling page via `t(i18n)` / `useLingui`.

### `<AppShot>` — `src/generic/component/app-shot/app-shot.tsx`

| Prop       | Type                     | Notes                                                                     |
| ---------- | ------------------------ | ------------------------------------------------------------------------- |
| `group`    | `string`                 | Literal. The route slug.                                                  |
| `scene`    | `string`                 | Literal. The capture scene id.                                            |
| `locale`   | `string`                 | The `[lang]` route param, threaded down as a prop.                        |
| `alt`      | `string`                 | Page-owned copy.                                                          |
| `fallback` | `ReactNode`              | Rendered when the scene has no capture yet. Omit it to render nothing.    |
| `frame`    | `MediaFrameEnum`         | `DEVICE` (default, transparent device frame) or `RAW` (adds rounding/ring). |
| `priority` | `boolean`                | Hero only: `loading="eager"` + `fetchPriority="high"`. Defaults to lazy.  |
| `sizes`    | `string`                 | Responsive hint forwarded to the `<img>`.                                 |

### `<AppClip>` — `src/generic/component/app-clip/app-clip.tsx`

Same `group` / `scene` / `locale` / `alt` / `fallback` / `frame` props. Renders
`<video autoPlay muted loop playsInline preload="metadata" poster=…>` with `<source type="video/webm">` before
`<source type="video/mp4">`.

**Reduced motion is handled in CSS, with no JS.** Each theme wrapper contains both the `<video class="motion-reduce:hidden">`
and an `<img class="hidden motion-reduce:block">` poster still, so `prefers-reduced-motion: reduce` shows the poster only.
The theme axis lives on the wrapper `<div>` and the motion axis on the children, which keeps the two Tailwind variants
from competing for specificity (`dark:` utilities are emitted *after* `motion-reduce:` ones).

`preload="metadata"` plus `display: none` means a hidden or motion-reduced clip does not download its payload, and
Chrome/Safari do not autoplay a non-rendered `<video>`.

GIF is never shipped: 5-10× the bytes of the equivalent VP9 clip, a 256-colour palette that bands Budgie's gradients, and
no way to pause it for reduced motion.

---

## 7. Adding assets

1. Drop the encoded files into `public/media/<group>/<locale>/<theme>/` following the contract above.
2. `pnpm --filter @budgie-at/landing media:manifest`
3. Render them from a page:
    ```tsx
    <AppShot alt={t(i18n)`…`} group="monobank-sync" locale={lang} scene="account-list" />
    ```
4. `pnpm --filter @budgie-at/landing media:check`
5. Commit the binaries **and** the regenerated `media-manifest.constant.ts` together.

The manifest types `group`, `scene` and `locale` as `string` on purpose: deriving literal unions from the generated array
would make every usage a type error while the array is still empty. `media:check` is what catches a typo'd slug.
