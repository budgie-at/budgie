import { createHash } from 'crypto';

import { PRIVATBANK_EXTERNAL_ID_LENGTH } from '../constant/privatbank.constant';

import type { PrivatbankExternalIdInputInterface } from '../interface/privatbank-external-id-input.interface';

export const generatePrivatbankExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    createHash('sha256')
        .update(`${input.date.toISOString()}|${input.card}|${input.cardAmount}|${input.operationAmount}|${input.description}`)
        .digest('hex')
        .slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);
