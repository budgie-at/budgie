export const formatSymbolAmount = (value: number, symbol: string, formatAbsolute: (absolute: number) => string): string =>
    `${value < 0 ? '\u2212' : ''}${symbol}${formatAbsolute(Math.abs(value))}`;
