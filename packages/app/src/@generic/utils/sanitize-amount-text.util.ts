import { isNotEmptyString } from '@rnw-community/shared';

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

export const sanitizeAmountText = (
    text: string,
    decimalSeparator: string,
    digitGroupingSeparator: string,
    decimalPlaces: number
): string => {
    if (!isNotEmptyString(text)) {
        return '';
    }

    const separators = decimalSeparator === digitGroupingSeparator ? [decimalSeparator] : [decimalSeparator, digitGroupingSeparator];
    const chars = Array.from(text).filter(char => isDigit(char) || separators.includes(char));
    const lastSeparatorIndex = chars.reduce((lastIndex, char, index) => (separators.includes(char) ? index : lastIndex), -1);
    const digitCountAfterLastSeparator = chars.slice(lastSeparatorIndex + 1).filter(isDigit).length;
    const decimalChar = chars[lastSeparatorIndex];
    const shouldKeepDecimalSeparator =
        lastSeparatorIndex === chars.length - 1 || (decimalChar === decimalSeparator && digitCountAfterLastSeparator <= decimalPlaces);

    const result = chars.reduce(
        (acc, char, index) => {
            if (isDigit(char)) {
                return {
                    cleaned: acc.cleaned.concat(char),
                    hasDecimalSeparator: acc.hasDecimalSeparator
                };
            }

            const currentChar = index === lastSeparatorIndex && shouldKeepDecimalSeparator ? decimalSeparator : char;

            if (currentChar === decimalSeparator && !acc.hasDecimalSeparator) {
                return {
                    cleaned: acc.cleaned.concat(currentChar),
                    hasDecimalSeparator: true
                };
            }

            return acc;
        },
        { cleaned: '', hasDecimalSeparator: false }
    );

    return result.cleaned;
};
