import { isDefined } from '@rnw-community/shared';

const INTEGER_GROUP_BOUNDARY = /\B(?=(\d{3})+(?!\d))/gu;

export const formatKeypadAmount = (rawAmount: string, decimalSeparator: string, groupingSeparator: string): string => {
    const [integerPart = '', fractionPart] = rawAmount.split('.');
    const groupedIntegerPart = integerPart.replaceAll(INTEGER_GROUP_BOUNDARY, groupingSeparator);

    return isDefined(fractionPart) ? `${groupedIntegerPart}${decimalSeparator}${fractionPart}` : groupedIntegerPart;
};
