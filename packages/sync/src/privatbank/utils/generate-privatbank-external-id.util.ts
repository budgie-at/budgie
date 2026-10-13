import { generateStableExternalIdHash } from '../../core/utils/generate-stable-external-id-hash.util';

import type { PrivatbankExternalIdInputInterface } from '../interface/privatbank-external-id-input.interface';

const EXTERNAL_ID_LENGTH = 32;

export const generatePrivatbankExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        [
            input.rawDate,
            input.card,
            input.description,
            input.cardAmount,
            input.cardCurrency,
            input.operationAmount,
            input.operationCurrency
        ].join('|')
    ).slice(0, EXTERNAL_ID_LENGTH);

export const generatePrivatbankLegacyExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        [
            input.rawDate,
            input.card,
            input.category,
            input.description,
            input.cardAmount,
            input.cardCurrency,
            input.operationAmount,
            input.operationCurrency,
            input.endBalance,
            input.balanceCurrency
        ].join('|')
    ).slice(0, EXTERNAL_ID_LENGTH);

export const generatePrivatbankParsedDateLegacyExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        `${input.deviceLocalDate.toISOString()}|${input.card}|${input.cardAmount}|${input.operationAmount}|${input.description}`
    ).slice(0, EXTERNAL_ID_LENGTH);
