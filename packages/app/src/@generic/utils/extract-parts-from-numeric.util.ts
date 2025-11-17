import { DEFAULT_DECIMAL_PLACES } from '../constant/default-decimal-places.constant';

export const extractPartsFromNumeric = (normalized: string, decimalPlaces = DEFAULT_DECIMAL_PLACES) => {
    const [integerPart = '', decimalPart = ''] = normalized.split('.');

    return {
        integerPart,
        hasDecimal: normalized.includes('.'),
        decimalPart: decimalPart.slice(0, decimalPlaces)
    };
};
