# React Native Amount Input

Auto-fitting amount input and display for React Native. Hero amounts shrink to fit the row by **measuring** the rendered
text, not by guessing from the character count, so a long balance such as `₴ 405 000,00` or a nine-digit value always
fits next to its currency symbol. The package also ships the parsing rules for typed amounts and a flip sign toggle.

Target npm name once moved to rnw-community: `@rnw-community/react-native-amount-input` (workspace name inside Budgie:
`@budgie/amount-input`).

## Installation

```bash
npm install @rnw-community/react-native-amount-input react-native-reanimated
```

React Native Reanimated is a peer dependency (`>=4.1.0 <5`) used for the sign flip's CSS transition, so no worklet is
compiled from this package. Supported platforms: iOS and Android.

## React Compiler

The published output is precompiled with the React Compiler targeting React 18+; `react-compiler-runtime` ships as a
dependency.

## Quick start

```tsx
import { AmountField, AmountFieldInput, AmountFieldPrefix } from '@rnw-community/react-native-amount-input';

const format = {
    decimalSeparator: ',',
    groupingSeparator: ' ',
    decimalPlaces: 2,
    format: (value: number) => new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2 }).format(value)
};

export const BalanceField = ({ value, onChange }: Props) => (
    <AmountField fontSize={72}>
        <AmountFieldPrefix>₴</AmountFieldPrefix>
        <AmountFieldInput value={value} format={format} onChangeValue={onChange} placeholder="0,00" selectTextOnFocus />
    </AmountField>
);
```

## How fitting works

Every part of an `AmountField` renders an invisible, accessibility-hidden, single-line copy of its text at the base
font size and reports its width. The field sums the part widths (plus the symbol gaps) and sets
`fontSize = clamp(base × available / measured, base × minimumFontScale, base)`, where `available` is the row's own
content width (padding excluded). The measuring copies never change size, so a re-fit costs one render and can never
loop. Re-fitting happens on value, placeholder, focus (raw text), locale and typography changes.

The field fits against its own width, so give it a definite one (`flex: 1` in a row, `alignSelf: 'stretch'` inside a
centered column); a content-sized field has nothing to shrink into.

Typography reaches the measuring copy through `style` and `className` only: keep layout classes (borders, padding)
off the parts and on the `AmountField` itself.

## Recipes

- **Suffix symbol** (crypto codes): `<AmountFieldInput textAlign="right" /><AmountFieldSuffix scale={0.4}>BTC</AmountFieldSuffix>`.
- **Read-only hero driven by an external keypad**: `<AmountField fontSize={52}><AmountFieldText>{text}</AmountFieldText></AmountField>`.
- **Inline input inside your own `TextInput` wrapper**: spread `useAmountInput({ value, format, onChangeValue })` onto it.
- **Signed amounts**: `useAmountSign(value, onChange)` plus `<AmountSignToggle />`.

## API reference

### `AmountField`

Row that fits its parts. Extends `ViewProps` (applied to the outer view).

| Prop               | Type        | Default | Description                                    |
| ------------------ | ----------- | ------- | ---------------------------------------------- |
| `fontSize`         | `number`    | —       | Base (maximum) font size of the amount.        |
| `minimumFontScale` | `number`    | `0.3`   | Smallest fraction of `fontSize` it may shrink. |
| `children`         | `ReactNode` | —       | Parts listed below.                            |

### `AmountFieldInput`

Editable amount (`decimal-pad`). Shows `format.format(value)` when blurred and the raw ungrouped value when focused.
Extends `TextInputProps` except `value`, `onChangeText` and `keyboardType`.

| Prop            | Type                      | Description                                           |
| --------------- | ------------------------- | ----------------------------------------------------- |
| `value`         | `number`                  | Current amount; `0` renders the placeholder.          |
| `format`        | `AmountFormatInterface`   | Separators, decimal places and the display formatter. |
| `onChangeValue` | `(value: number) => void` | Called on every keystroke with the parsed number.     |
| `className`     | `string`                  | Forwarded to the input and its measuring copy.        |

### `AmountFieldText`

Read-only single-line amount. Extends `TextProps`; `children` is the string to show.

### `AmountFieldPrefix` / `AmountFieldSuffix`

Currency symbol before or after the amount, separated by a gap of `0.2 × fontSize`. Extend `TextProps`.

| Prop    | Type     | Default | Description                                       |
| ------- | -------- | ------- | ------------------------------------------------- |
| `scale` | `number` | `1`     | Symbol font size as a fraction of the amount's.   |

### `AmountSignToggle`

Pressable that flips between two faces. Extends `PressableProps`; exposes `accessibilityRole="switch"` with
`accessibilityState.checked` equal to `isNegative`. Pass an `accessibilityLabel`.

| Prop           | Type        | Description                   |
| -------------- | ----------- | ----------------------------- |
| `isNegative`   | `boolean`   | Shows the negative face.      |
| `positiveIcon` | `ReactNode` | Face shown for a plus sign.   |
| `negativeIcon` | `ReactNode` | Face shown for a minus sign.  |

### Hooks

| Hook                               | Returns                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `useAmountInput(options)`          | `TextInput` props (`value`, handlers, `keyboardType`, `selection`).        |
| `useAmountSign(value, onChange)`   | `{ isNegative, absoluteValue, toggleSign, changeAbsoluteValue }`.          |

`useAmountInput` options: `value`, `format`, `onChangeValue`, `commitOnBlur` (report only on blur),
`selectTextOnFocus`, `onFocus`, `onBlur`. `useAmountSign` keeps a chosen sign while the value is `0`.

## Platform notes

- iOS `TextInput` has no `adjustsFontSizeToFit`, which is why the field measures instead.
- Android `TextInput` padding is reset to `0` on `AmountFieldInput` so the measured width matches the drawn one.
- Hermes-safe: no `Intl.NumberFormat#formatToParts`, no `Array#toSorted`.
