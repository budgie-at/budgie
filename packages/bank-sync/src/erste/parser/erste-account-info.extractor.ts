import { Log } from '@budgie/logger';
import { isValid } from 'date-fns';

import { getErrorMessage } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_CURRENCY_ALPHA_EUR, ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const IBAN_LABEL_PREFIX = 'IBAN: ';
const NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand';
const ALTER_KONTOSTAND_LABEL = 'Alter Kontostand';
const STATEMENT_FOOTER_REGEX = /^AT\d{18,20}\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/u;
const AMOUNT_ONLY_REGEX = /^(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

class ErsteAccountInfoExtractor {
    @Log(
        items => `enter itemCount=${items.length}`,
        (result, items) =>
            `done itemCount=${items.length} iban=${result.iban} oldBalance=${result.oldBalance} newBalance=${result.newBalance}`,
        (error, items) => `throw itemCount=${items.length} error=${getErrorMessage(error)}`
    )
    extract(items: PdfTextItemInterface[]): ErsteAccountInfoInterface {
        return {
            iban: this.findIban(items),
            accountNumber: '',
            currency: ERSTE_CURRENCY_ALPHA_EUR,
            oldBalance: this.findOldBalance(items),
            newBalance: this.findNewBalance(items),
            statementDate: this.findStatementDate(items)
        };
    }

    private findIban(items: PdfTextItemInterface[]): string {
        const ibanItem = items.find(item => item.text.startsWith(IBAN_LABEL_PREFIX));

        if (!ibanItem) {
            throw new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, 'Could not find IBAN in Erste PDF', BankProviderEnum.ERSTE);
        }

        return ibanItem.text.slice(IBAN_LABEL_PREFIX.length).trim();
    }

    private findStatementDate(items: PdfTextItemInterface[]): Date {
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

        throw new BankSyncError(
            BankSyncErrorCodeEnum.INVALID_RESPONSE,
            'Could not find statement date in Erste PDF',
            BankProviderEnum.ERSTE
        );
    }

    private findOldBalance(items: PdfTextItemInterface[]): number {
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
    }

    private findNewBalance(items: PdfTextItemInterface[]): number {
        const balanceItem = items.find(item => item.text.startsWith(NEW_BALANCE_INLINE_PREFIX));

        if (!balanceItem) {
            return 0;
        }

        const tail = balanceItem.text.slice(NEW_BALANCE_INLINE_PREFIX.length).trim();
        const match = AMOUNT_ONLY_REGEX.exec(tail);

        return match ? parseErsteAmount(match[1], match[2] === '-') : 0;
    }
}

export const ersteAccountInfoExtractor = new ErsteAccountInfoExtractor();
