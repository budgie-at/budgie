export const formatEditableAmount = (value: number, decimalSeparator: string, decimalPlaces: number): string =>
    value === 0 ? '' : Number(value.toFixed(decimalPlaces)).toString().replace('.', decimalSeparator);
