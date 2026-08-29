import { generateStableExternalIdHash } from '../../core/util/generate-stable-external-id-hash.util';
import { PRIVATBANK_EXTERNAL_ID_LENGTH } from '../constant/privatbank.constant';

import type { PrivatbankExternalIdInputInterface } from '../interface/privatbank-external-id-input.interface';

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
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);

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
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);

export const generatePrivatbankParsedDateLegacyExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        `${input.date.toISOString()}|${input.card}|${input.cardAmount}|${input.operationAmount}|${input.description}`
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);
