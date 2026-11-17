import { isNotEmptyString } from '@rnw-community/shared';

import { PRIVATBANK_OWN_CARD_TITLE_PHRASES } from '../constant/privatbank-own-card-title-phrases.constant';

import { extractCardEnding } from './extract-card-ending.util';

import type { TransferLegEvidenceType } from '../../core/interface/transfer-leg-evidence.type';

export const isPrivatbankOwnCardTransferTitle: TransferLegEvidenceType = (
    title,
    { counterpartAliasExternalIds, counterpartExternalId, counterpartIban }
) => {
    const maskStart = title.indexOf('*') + 1;
    const counterpartCard = isNotEmptyString(counterpartExternalId) ? counterpartExternalId : counterpartIban;

    return (
        maskStart > 0 &&
        PRIVATBANK_OWN_CARD_TITLE_PHRASES.some(phrase => title.includes(phrase)) &&
        [counterpartCard, ...counterpartAliasExternalIds].some(card => {
            const cardEnding = isNotEmptyString(card) ? extractCardEnding(card) : '';

            return isNotEmptyString(cardEnding) && title.slice(maskStart, maskStart + cardEnding.length) === cardEnding;
        })
    );
};
