const TRAILING_FRACTION_ZEROS = /\.?0+$/u;

export const formatEditableAmount = (value: number, decimalSeparator: string, decimalPlaces: number): string => {
    if (value === 0) {
        return '';
    }

    const fixedText = value.toFixed(decimalPlaces);
    const trimmedText = fixedText.includes('.') ? fixedText.replace(TRAILING_FRACTION_ZEROS, '') : fixedText;

    return (trimmedText === '-0' ? '0' : trimmedText).replace('.', decimalSeparator);
};
