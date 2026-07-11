# @budgie/screen-chrome

Generic, composable **scroll edge fade + blur chrome** and **collapsible header** for React Native (Expo). Consumed as raw TypeScript source by `@budgie-at/app` and reusable across projects.

`CLAUDE.md` is a symlink to this file.

## What it provides

- **`EdgeFade`** — a decorative top/bottom edge band: an eased gradient mask over a color wash + native `expo-blur` BlurView (web: `backdrop-filter` + `mask-image`). Fades and blurs content out under chrome. Optionally scroll-driven.
- **`CollapsibleHeader`** (compound) — an iOS-style large title that cross-fades into a small title on scroll, with a scroll-driven blur backdrop.
- **`ScreenChromeProvider` / `ScreenChromeScrollView` / hooks** — the scroll-position plumbing that drives the collapse and scroll-reactive fades.

## Consumption model (IMPORTANT)

- Raw source: `package.json` `main`/`exports` point at `./src/index.ts` (no `dist`, no build step). Metro transpiles the TS/TSX directly.
- After editing this package's `src`, the app does **NOT** need a native rebuild. It needs the **JS bundle rebuilt**: restart Metro with cache clear (`expo start --dev-client -c`) or reload — Fast Refresh does not always re-read a symlinked workspace package, so a cache-clear reload is the reliable way to see package changes.
- `react-native` export condition points at source so Metro resolves the untranspiled TS; do not add a `dist` build unless the consuming app's bundler stops transpiling workspace source.

## Public API

```tsx
<ScreenChromeProvider colorScheme={ColorSchemeEnum.Light} config={{ topFadeHeight: 112, bottomFadeHeight: 112 }}>
  <ScreenChromeFrame>
    <ScreenChromeContent>
      <ScreenChromeScrollView>{content}</ScreenChromeScrollView>
    </ScreenChromeContent>
    <EdgeFade position="top" scrollAnimation={{ opacityInputRange: [0, 40] }} />
    <EdgeFade position="bottom" />
    <CollapsibleHeader>
      <CollapsibleHeaderLeading>{back}</CollapsibleHeaderLeading>
      <CollapsibleHeaderTitleSlot>
        <CollapsibleHeaderLargeTitle><Title big /></CollapsibleHeaderLargeTitle>
      </CollapsibleHeaderTitleSlot>
      <CollapsibleHeaderTrailing>{actions}</CollapsibleHeaderTrailing>
      <CollapsibleHeaderSmallTitle><Title small /></CollapsibleHeaderSmallTitle>
    </CollapsibleHeader>
    <CollapsibleHeaderBackdrop />
  </ScreenChromeFrame>
</ScreenChromeProvider>
```

- **`ScreenChromeProvider`** — owns a `scrollY` SharedValue + merged config. `colorScheme` is injected (no theme-lib dependency). **Each screen that wants an independent collapse needs its own provider instance** — a single app-root provider makes all screens share one `scrollY`, which is wrong for per-screen collapse. Mount one provider per collapsible screen (bridge `colorScheme` from the app theme).
- **`EdgeFade`** — props: `position` (`'top' | 'bottom'`), `height?`, `intensity?`, `scrollAnimation?`, `blurMethod?` (Android only), `style?`. Height defaults to `config.{top,bottom}FadeHeight` and the safe-area inset is added **once** inside the component — do NOT pre-add the inset in the caller (that double-counts and the band spills into content).
- **`CollapsibleHeader*`** — compound parts; title components are consumer-provided children (package animates opacity only, no fonts/i18n). The row is single-tier: `CollapsibleHeaderLeading`/`CollapsibleHeaderTrailing` render only when supplied (no phantom 44px box when absent) and sit in normal flex flow. `CollapsibleHeaderLargeTitle` is an **inline flex child** inside `CollapsibleHeaderTitleSlot` — it flows immediately after `CollapsibleHeaderLeading` (so a back chevron and the large title always share one line, `‹ Title`) and only its opacity fades on scroll, never its position. `CollapsibleHeaderSmallTitle` is the opposite: an **absolutely-positioned layer spanning the full row** (ignoring where Leading/Trailing sit), content centered with generous horizontal padding so it never underlaps the slots — this is what makes the collapsed title sit at true screen-center regardless of whether a leading/trailing slot is present. It is `pointerEvents="none"` and painted at a lower `zIndex` than the slots, which stay tappable on top.
- **`ScreenChromeScrollView`** — `Animated.ScrollView` prewired to the provider's scroll handler; feeds `scrollY`. Preserves consumer `contentContainerStyle` padding (top and bottom both merged additively with safe-area insets).
- **Hooks** — `useScreenChrome`, `useScreenChromeScrollHandler`, `useScrollFadeStyle`.
- **Config** — every threshold/height/intensity/color/mask curve is overridable via `ScreenChromeProvider config`. Defaults in `src/constant/`.

## Theming

`colorScheme` is a prop (`ColorSchemeEnum.Light | Dark`), not read from any theme lib. In budgie, bridge it from `useThemeContext().isDarkColorSchema` in a thin app-side provider. Light wash colors are near-white and read subtly on white backgrounds — the blur (not the wash) carries the visual separation on iOS.

## Hard-won gotchas (do not regress)

- **The progressive glass recipe** (verified on-device; same architecture as the rit3zh/expo-progressive-blur reference): `MaskedView` (from `@react-native-masked-view/masked-view`) whose `maskElement` is an eased multi-stop `LinearGradient` (via `react-native-easing-gradient`), containing `[wash LinearGradient (solid → 0.2 alpha), BlurView (gentle intensity ~15–25, systemChromeMaterial tint)]`. The mask tapers BOTH the fade and the frost — that is the gradual dissolve. Do NOT replace with a bare BlurView (hard edge, no taper) and do NOT use `@expo/ui/community/masked-view` (SwiftUI Host; can composite against the window and make the app surface transparent when a full-screen overlay/menu opens).
- **Light-theme frost is inherently subtle over white content** — before concluding "blur is broken," test against colored/dense content or dark mode. The blur IS there; white-on-white just hides it.
- **Content must be FULL-BLEED for the effect to read** — never apply safe-area top padding to the page/content container (that clips the scroll viewport at the band edge, killing the "content dissolves into the notch" beauty). The safe-area inset belongs INSIDE the scroll content padding (`paddingTop: insets.top + headerHeight`), so content scrolls under the glass to y=0.
- **Avoid double bands**: on tab screens the tab layout owns the bottom band — a page component must only render its own bottom band when it renders a footer. Bottom glass exists ONLY under floating chrome: the tab bar (owned by the tab layout) or a sticky footer (owned by `ChromePage`'s `footer` slot). A pushed, footerless screen (e.g. a selector/content list with no tab bar) is bottomless by design — do not add a bottom `EdgeFade` "for symmetry" with the top band; content should run to the screen edge untouched.
- Unmount the tab-layout `EdgeFade` while a full-screen backdrop/menu is open (`{isBackdropVisible ? null : <EdgeFade position="bottom" />}`) — the band is invisible under an opaque backdrop anyway and this avoids overlay compositing edge cases.
- **Worklet safety**: never call non-worklet functions (including `@rnw-community/shared` guards) inside `useAnimatedStyle`/`useAnimatedProps`/`useAnimatedScrollHandler` bodies. Compute plain values in the hook/component body and capture them into the worklet.
- **Metro + workspace source**: after changing this package, reload with cache clear — do not assume Fast Refresh picked it up.
- **Mask curve controls how much blur is visible**: the outer portion of the band at full mask opacity is where the blur reads; if that region is too small (or occluded by a tab bar/footer) the effect looks like a plain fade with no blur. Defaults: top `{0: 0.99, 0.5: #000, 1: transparent}`, bottom mirrored, eased.
- **react-compiler is NOT applied to this package** in some monorepos (Metro resolves the symlink via a `node_modules` real path that the compiler skips). Memoize provider context value/config manually here rather than relying on the compiler.

## Repo rules

No comments in code, no `any`, no `as`/`@ts-ignore`, `*Interface`/`*Enum` naming, kebab-case files, `@rnw-community/shared` guards. One component per file/folder.
