import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

export const sanitizeAmountText = (text: string, decimalSeparator: string, groupingSeparator: string, decimalPlaces: number): string => {
    if (!isNotEmptyString(text)) {
        return '';
    }

    const separators = new Set([decimalSeparator, groupingSeparator, '.', ',']);
    const chars = Array.from(text).filter(char => isDigit(char) || separators.has(char));
    const lastSeparatorIndex = chars.reduce((lastIndex, char, index) => (separators.has(char) ? index : lastIndex), -1);
    const digitCountAfterLastSeparator = chars.slice(lastSeparatorIndex + 1).filter(isDigit).length;
    const shouldKeepDecimalSeparator =
        isPositiveNumber(decimalPlaces) &&
        (lastSeparatorIndex === chars.length - 1 ||
            (chars[lastSeparatorIndex] === decimalSeparator && digitCountAfterLastSeparator <= decimalPlaces));

    return chars
        .map((char, index) => {
            if (isDigit(char)) {
                return char;
            }

            return index === lastSeparatorIndex && shouldKeepDecimalSeparator ? decimalSeparator : '';
        })
        .join('');
};
