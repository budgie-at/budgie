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
                <CollapsibleHeaderLargeTitle>
                    <Title big />
                </CollapsibleHeaderLargeTitle>
            </CollapsibleHeaderTitleSlot>
            <CollapsibleHeaderTrailing>{actions}</CollapsibleHeaderTrailing>
            <CollapsibleHeaderSmallTitle>
                <Title small />
            </CollapsibleHeaderSmallTitle>
        </CollapsibleHeader>
        <CollapsibleHeaderBackdrop />
    </ScreenChromeFrame>
</ScreenChromeProvider>
```

- **`ScreenChromeProvider`** — owns a `scrollY` SharedValue (via `useScrollViewOffset(scrollRef)`, so it always mirrors the scrollable's true native offset) + merged config. `colorScheme` is injected (no theme-lib dependency). **Each screen that wants an independent collapse needs its own provider instance** — a single app-root provider makes all screens share one `scrollY`, which is wrong for per-screen collapse. Mount one provider per collapsible screen (bridge `colorScheme` from the app theme).
- **`EdgeFade`** — props: `position` (`'top' | 'bottom'`), `height?`, `intensity?`, `scrollAnimation?`, `blurMethod?` (Android only), `style?`. Height defaults to `config.{top,bottom}FadeHeight` and the safe-area inset is added **once** inside the component — do NOT pre-add the inset in the caller (that double-counts and the band spills into content).
- **`CollapsibleHeader*`** — compound parts; title components are consumer-provided children (package animates opacity only, no fonts/i18n). The row is single-tier: `CollapsibleHeaderLeading`/`CollapsibleHeaderTrailing` render only when supplied (no phantom 44px box when absent) and sit in normal flex flow. `CollapsibleHeaderLargeTitle` is an **inline flex child** inside `CollapsibleHeaderTitleSlot` — it flows immediately after `CollapsibleHeaderLeading` (so a back chevron and the large title always share one line, `‹ Title`) and only its opacity fades on scroll, never its position. `CollapsibleHeaderSmallTitle` is the opposite: an **absolutely-positioned layer spanning the full row** (ignoring where Leading/Trailing sit), content centered with generous horizontal padding so it never underlaps the slots — this is what makes the collapsed title sit at true screen-center regardless of whether a leading/trailing slot is present. It is `pointerEvents="none"` and painted at a lower `zIndex` than the slots, which stay tappable on top.
- **`ScreenChromeScrollView`** — `Animated.ScrollView` prewired to the provider's `scrollRef` (which is what actually drives `scrollY`) and scroll handler (snap-to-collapse only). Preserves consumer `contentContainerStyle` padding (top and bottom both merged additively with safe-area insets).
- **Custom scrollables** (a virtualized list instead of `ScreenChromeScrollView`, e.g. `AnimatedLegendList`/`Animated.FlatList`): `scrollY` is only live if something feeds it. Either attach the provider's `scrollRef` (via `useScreenChrome().scrollRef`) as the list's animated scroll-view ref so `useScrollViewOffset` can track it directly, or — when the list manages its own native scroll view and can't share `scrollRef` (e.g. `@legendapp/list`'s `sharedValues.scrollOffset`) — bind `useScreenChrome().scrollY` as that external shared value so the list writes into the same SharedValue instance. Do not also attach `scrollRef` in that second case — nothing would ever feed it, and it's harmless to leave unattached, but there is no snap-to-collapse without a real `scrollRef`.
- **Hooks** — `useScreenChrome`, `useScreenChromeScrollHandler` (returns the snap-to-collapse `onEndDrag`/`onMomentumEnd` handler only — it no longer writes `scrollY`), `useScrollFadeStyle`.
- **Config** — every threshold/height/intensity/color/mask curve is overridable via `ScreenChromeProvider config`. Defaults in `src/constant/`.

## Theming

`colorScheme` is a prop (`ColorSchemeEnum.Light | Dark`), not read from any theme lib. In budgie, bridge it from `useThemeContext().isDarkColorSchema` in a thin app-side provider. Light wash colors are near-white and read subtly on white backgrounds — the blur (not the wash) carries the visual separation on iOS.

## Hard-won gotchas (do not regress)

- **The progressive glass recipe** (verified on-device; same architecture as the rit3zh/expo-progressive-blur reference): `MaskedView` (from `@react-native-masked-view/masked-view`) whose `maskElement` is an eased multi-stop `LinearGradient` (via `react-native-easing-gradient`), containing `[wash LinearGradient (solid → 0.2 alpha), BlurView (gentle intensity ~15–25, systemChromeMaterial tint)]`. The mask tapers BOTH the fade and the frost — that is the gradual dissolve. Do NOT replace with a bare BlurView (hard edge, no taper) and do NOT use `@expo/ui/community/masked-view` (SwiftUI Host; can composite against the window and make the app surface transparent when a full-screen overlay/menu opens).
- **Light-theme frost is inherently subtle over white content** — before concluding "blur is broken," test against colored/dense content or dark mode. The blur IS there; white-on-white just hides it.
- **Content must be FULL-BLEED for the effect to read** — never apply safe-area top padding to the page/content container (that clips the scroll viewport at the band edge, killing the "content dissolves into the notch" beauty). The safe-area inset belongs INSIDE the scroll content padding (`paddingTop: insets.top + headerHeight`), so content scrolls under the glass to y=0.
- **Avoid double bands**: on tab screens the tab layout owns the bottom band — a page component must only render its own bottom band when it renders a footer. Bottom glass exists ONLY under floating chrome: the tab bar (owned by the tab layout) or a sticky footer (owned by `ChromePage`'s or `CollapsibleChromePage`'s `footer` slot). A pushed, footerless screen (e.g. a selector/content list with no tab bar) is bottomless by design — do not add a bottom `EdgeFade` "for symmetry" with the top band; content should run to the screen edge untouched.
- **`ScreenChromeScrollView` has no keyboard-aware auto-scroll — this is a real gap, not just an accepted tradeoff.** It is a plain `Animated.ScrollView`; a focused input near the bottom of the content can end up hidden behind a risen `CollapsibleChromePage` `footer` (`StickyFooterBand`/`KeyboardStickyView`), and worse, a tap meant for that hidden field/control can land on the footer's CTA instead (confirmed regression: typing into a form's name field then tapping the row below it hit the Submit button once the keyboard raised the footer over it). Do not reach for `ScreenChromeScrollView` — or a bare `KeyboardAwareScrollView` that drops `scrollY` tracking — for any screen with focusable inputs.
- **The app-level fix: `ChromeKeyboardScrollView`** (`packages/app/src/@generic/component/chrome-keyboard-scroll-view/chrome-keyboard-scroll-view.tsx`) wraps `KeyboardAwareScrollView` (from `react-native-keyboard-controller`) via `Animated.createAnimatedComponent`, so it both auto-scrolls the focused field clear of the keyboard/footer (`bottomOffset` ≈ the sticky footer's height) AND keeps driving the package's `scrollY`. `CollapsibleChromePage` uses it unconditionally as its scroll container (not gated on `footer` being defined) — one scroll implementation for every consumer is simpler to reason about and safer than branching per-screen, and a keyboard-aware scroller is a harmless no-op on screens that never focus a `TextInput` (Settings, crypto/market, etc.). Two RN keyboard-tap gotchas apply: set `keyboardShouldPersistTaps="handled"` (default RN behavior otherwise swallows the first tap outside the focused input just to dismiss the keyboard, instead of passing it to the control underneath — this silently breaks the exact "tap a control while another field is focused" case the auto-scroll fix is for) and `keyboardDismissMode="on-drag"` to match the old `FormPage` behavior.
- **Custom keyboard-aware scrollables must attach the provider's `scrollRef` themselves, and reuse the package's inset/ref utils instead of duplicating them.** `mergeRefs` (`utils/merge-refs.util.ts`) and `mergeScrollContentInset` (`utils/merge-scroll-content-inset.util.ts`) are exported from the package index for exactly this: merge `useScreenChrome().scrollRef` with the consumer's own `ref`, and merge `contentInsetTop`/`contentInsetBottom` + safe-area insets into `contentContainerStyle`, the same way `ScreenChromeScrollView` does internally. Whether `useScrollViewOffset(scrollRef)` can still track the wrapped component depends on the wrapper actually forwarding `ref` down to a real native scrollable node (verify on-device — a wrapper that only exposes a synthetic imperative-handle object, with no underlying `ScrollView` instance behind it, breaks tracking silently); `KeyboardAwareScrollView` does forward the real scroll view instance, which is what makes this pattern work for it.
- Unmount the tab-layout `EdgeFade` while a full-screen backdrop/menu is open (`{isBackdropVisible ? null : <EdgeFade position="bottom" />}`) — the band is invisible under an opaque backdrop anyway and this avoids overlay compositing edge cases.
- **Worklet safety**: never call non-worklet functions (including `@rnw-community/shared` guards) inside `useAnimatedStyle`/`useAnimatedProps`/`useAnimatedScrollHandler` bodies. Compute plain values in the hook/component body and capture them into the worklet.
- **Metro + workspace source**: after changing this package, reload with cache clear — do not assume Fast Refresh picked it up.
- **Mask curve controls how much blur is visible**: the outer portion of the band at full mask opacity is where the blur reads; if that region is too small (or occluded by a tab bar/footer) the effect looks like a plain fade with no blur. Defaults: top `{0: 0.99, 0.5: #000, 1: transparent}`, bottom mirrored, eased.
- **react-compiler is NOT applied to this package** in some monorepos (Metro resolves the symlink via a `node_modules` real path that the compiler skips). Memoize provider context value/config manually here rather than relying on the compiler.
- **`scrollY` must reflect the native offset, not accumulate from `onScroll` events.** Writing `scrollY.value` only inside `useAnimatedScrollHandler`'s `onScroll` desyncs it whenever the scroll view's real position changes without an `onScroll` event firing — the classic repro: scroll a screen so the header collapses, push a sub-screen, pop back. `ScrollView` natively restores its previous offset (no scroll event fires for that), but the handler-driven `scrollY` stayed wherever it last was (often 0), so the header renders expanded over already-scrolled content. Fixed by deriving `scrollY` from `useScrollViewOffset(scrollRef)`, which mirrors the scrollable's true offset (including after remount/focus-restore) instead of accumulating deltas. `useAnimatedScrollHandler` is now used only for the `snapToCollapse` logic (`onEndDrag`/`onMomentumEnd`); it must not regain an `onScroll` writer for `scrollY`.

## Repo rules

No comments in code, no `any`, no `as`/`@ts-ignore`, `*Interface`/`*Enum` naming, kebab-case files, `@rnw-community/shared` guards. One component per file/folder.
