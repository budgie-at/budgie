export const normalizeAmountDecimalSeparators = (text: string, decimalSeparator: string, acceptedSeparators: readonly string[]): string =>
    Array.from(text)
        .map(character => (acceptedSeparators.includes(character) ? decimalSeparator : character))
        .join('');
