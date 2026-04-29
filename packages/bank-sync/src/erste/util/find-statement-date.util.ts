import { isValid } from 'date-fns';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';

import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const STATEMENT_FOOTER_REGEX = /^AT\d{18,20}\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/u;

export const findStatementDate = (items: PdfTextItemInterface[]): Date => {
    for (const item of items) {
        const match = STATEMENT_FOOTER_REGEX.exec(item.text);

        if (match) {
            const [, day, month, year, hours, minutes] = match;
            const date = new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hours, 10),
                parseInt(minutes, 10)
            );

            if (isValid(date)) {
                return date;
            }
        }
    }

    throw new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, 'Could not find statement date in Erste PDF', BankProviderEnum.ERSTE);
};
