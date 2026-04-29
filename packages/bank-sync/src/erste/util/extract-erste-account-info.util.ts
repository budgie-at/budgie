import { ERSTE_CURRENCY_ALPHA_EUR } from '../constant/erste.constant';

import { findIban } from './find-iban.util';
import { findNewBalance } from './find-new-balance.util';
import { findOldBalance } from './find-old-balance.util';
import { findStatementDate } from './find-statement-date.util';

import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export const extractErsteAccountInfo = (items: PdfTextItemInterface[]): ErsteAccountInfoInterface => ({
    iban: findIban(items),
    accountNumber: '',
    currency: ERSTE_CURRENCY_ALPHA_EUR,
    oldBalance: findOldBalance(items),
    newBalance: findNewBalance(items),
    statementDate: findStatementDate(items)
});
