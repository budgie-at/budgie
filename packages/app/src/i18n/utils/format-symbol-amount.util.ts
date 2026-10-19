export const formatSymbolAmount = (parts: readonly Intl.NumberFormatPart[], symbol: string): string => {
    const sign = parts.find(part => part.type === 'minusSign')?.value ?? '';
    const digits = parts
        .filter(part => part.type !== 'minusSign')
        .map(part => part.value)
        .join('');

    return `${sign}${symbol}${digits}`;
};
