import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';

import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const IBAN_LABEL_PREFIX = 'IBAN: ';

export const findIban = (items: PdfTextItemInterface[]): string => {
    const ibanItem = items.find(item => item.text.startsWith(IBAN_LABEL_PREFIX));

    if (!ibanItem) {
        throw new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, 'Could not find IBAN in Erste PDF', BankProviderEnum.ERSTE);
    }

    return ibanItem.text.slice(IBAN_LABEL_PREFIX.length).trim();
};
