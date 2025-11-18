import { isNotEmptyString } from '@rnw-community/shared';

export const sanitizeAmountText = (text: string, decimalSeparator: string, digitGroupingSeparator: string): string => {
    if (!isNotEmptyString(text)) {
        return '';
    }

    const lastIndex = text.length - 1;

    const result = Array.from(text).reduce(
        (acc, char, index) => {
            if (char >= '0' && char <= '9') {
                return {
                    cleaned: acc.cleaned.concat(char),
                    hasDecimalSeparator: acc.hasDecimalSeparator
                };
            }

            const currentChar = char === digitGroupingSeparator && index === lastIndex ? decimalSeparator : char;

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
