import { isPositiveNumber } from '@rnw-community/shared';

const INTEGER_GROUP_BOUNDARY = /\B(?=(\d{3})+(?!\d))/gu;

export const formatKeypadAmount = (
    rawAmount: string,
    decimalSeparator: string,
    groupingSeparator: string,
    minimumFractionDigits = 0
): string => {
    const [integerPart = '', fractionPart = ''] = rawAmount.split('.');
    const groupedIntegerPart = integerPart.replaceAll(INTEGER_GROUP_BOUNDARY, groupingSeparator);

    return rawAmount.includes('.') || isPositiveNumber(minimumFractionDigits)
        ? `${groupedIntegerPart}${decimalSeparator}${fractionPart.padEnd(minimumFractionDigits, '0')}`
        : groupedIntegerPart;
};
