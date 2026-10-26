import { isNotEmptyString } from '@rnw-community/shared';

import { sanitizeAmountText } from '../sanitize-amount-text/sanitize-amount-text.util';

import type { AmountFormatInterface } from '../../interface/amount-format.interface';
import type { ParsedAmountTextInterface } from '../../interface/parsed-amount-text.interface';

export const parseAmountText = (text: string, format: Omit<AmountFormatInterface, 'format'>): ParsedAmountTextInterface | null => {
    const sanitizedText = sanitizeAmountText(text, format.decimalSeparator, format.groupingSeparator, format.decimalPlaces);

    if (!isNotEmptyString(sanitizedText)) {
        return null;
    }

    const normalizedText = sanitizedText.replace(format.decimalSeparator, '.');

    return { text: sanitizedText, value: Number.parseFloat(normalizedText) || 0 };
};
