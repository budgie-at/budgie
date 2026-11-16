import { isDefined } from '@rnw-community/shared';

import { PRIVATBANK_OWN_CARD_TITLE_PHRASES } from '../constant/privatbank-own-card-title-phrases.constant';

import { extractCardEnding } from './extract-card-ending.util';

import type { TransferLegEvidenceType } from '../../core/interface/transfer-leg-evidence.type';

export const isPrivatbankOwnCardTransferTitle: TransferLegEvidenceType = (title, { counterpartExternalId, counterpartIban }) => {
    const maskStart = title.indexOf('*') + 1;
    const counterpartCard = counterpartExternalId ?? counterpartIban;

    return (
        maskStart > 0 &&
        isDefined(counterpartCard) &&
        PRIVATBANK_OWN_CARD_TITLE_PHRASES.some(phrase => title.includes(phrase)) &&
        title.slice(maskStart, maskStart + extractCardEnding(counterpartCard).length) === extractCardEnding(counterpartCard)
    );
};
