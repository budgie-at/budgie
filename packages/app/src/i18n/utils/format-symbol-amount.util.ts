export const formatSymbolAmount = (value: number, symbol: string, formatAbsolute: (absolute: number) => string): string =>
    `${value < 0 ? '-' : ''}${symbol}${formatAbsolute(Math.abs(value))}`;
