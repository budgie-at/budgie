import { isValid } from 'date-fns';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_CURRENCY_ALPHA_EUR, ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';

import { parseErsteAmount } from './parse-erste-amount.util';

import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const IBAN_LABEL_PREFIX = 'IBAN: ';
const NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand';
const ALTER_KONTOSTAND_LABEL = 'Alter Kontostand';

const STATEMENT_FOOTER_REGEX = /^AT\d{18,20}\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/u;
const AMOUNT_ONLY_REGEX = /^(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

const findIban = (items: PdfTextItemInterface[]): string => {
    const ibanItem = items.find(item => item.text.startsWith(IBAN_LABEL_PREFIX));

    if (!ibanItem) {
        throw new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, 'Could not find IBAN in Erste PDF', BankProviderEnum.ERSTE);
    }

    return ibanItem.text.slice(IBAN_LABEL_PREFIX.length).trim();
};

const findStatementDate = (items: PdfTextItemInterface[]): Date => {
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

const findOldBalance = (items: PdfTextItemInterface[]): number => {
    const labelItem = items.find(item => item.page === 1 && item.text === ALTER_KONTOSTAND_LABEL);

    if (!labelItem) {
        return 0;
    }

    const amountItem = items.find(
        item =>
            item.page === 1 &&
            Math.abs(item.y - labelItem.y) <= ERSTE_LAYOUT_Y_ROW_TOLERANCE &&
            item.x > labelItem.x &&
            AMOUNT_ONLY_REGEX.test(item.text)
    );

    if (!amountItem) {
        return 0;
    }

    const match = AMOUNT_ONLY_REGEX.exec(amountItem.text);

    return match ? parseErsteAmount(match[1], match[2] === '-') : 0;
};

const findNewBalance = (items: PdfTextItemInterface[]): number => {
    const balanceItem = items.find(item => item.text.startsWith(NEW_BALANCE_INLINE_PREFIX));

    if (!balanceItem) {
        return 0;
    }

    const tail = balanceItem.text.slice(NEW_BALANCE_INLINE_PREFIX.length).trim();
    const match = AMOUNT_ONLY_REGEX.exec(tail);

    return match ? parseErsteAmount(match[1], match[2] === '-') : 0;
};

export const extractErsteAccountInfo = (items: PdfTextItemInterface[]): ErsteAccountInfoInterface => ({
    iban: findIban(items),
    accountNumber: '',
    currency: ERSTE_CURRENCY_ALPHA_EUR,
    oldBalance: findOldBalance(items),
    newBalance: findNewBalance(items),
    statementDate: findStatementDate(items)
});
