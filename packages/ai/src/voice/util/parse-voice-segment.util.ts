import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';

import { normalizeVoiceCurrency } from './normalize-voice-currency.util';

const AMOUNT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(грн|гривень|гривня|uah|₴|usd|\$|eur|€|євро)?/iu;

export const parseVoiceSegment = (segment: string): ExtractedVoiceTransactionInterface | null => {
    const match = segment.match(AMOUNT_PATTERN);

    if (!isDefined(match) || !isDefined(match.index)) {
        return null;
    }

    const amount = Number(match[1].replace(',', '.'));

    if (!isPositiveNumber(amount)) {
        return null;
    }

    const beforeAmount = segment.slice(0, match.index).trim();
    const afterAmountStart = match.index + match[0].length;
    const afterAmount = segment.slice(afterAmountStart).trim();
    const description = [beforeAmount, afterAmount].filter(isNotEmptyString).join(' ').trim();

    if (!isNotEmptyString(description)) {
        return null;
    }

    return {
        amount,
        currency: normalizeVoiceCurrency(match[2]),
        description
    };
};
