import { isValid } from 'date-fns/isValid';
import * as Result from 'effect/Result';

import { isDefined } from '@rnw-community/shared';

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
    extract(items: PdfTextItemInterface[]): Result.Result<ErsteAccountInfoInterface, string> {
        const iban = this.findIban(items);
        const statementDate = this.findStatementDate(items);

        if (!isDefined(iban)) {
            return Result.fail('Could not find IBAN in Erste PDF');
        }

        if (!isDefined(statementDate)) {
            return Result.fail('Could not find statement date in Erste PDF');
        }

        return Result.succeed({
            iban,
            accountNumber: '',
            currency: ERSTE_CURRENCY_ALPHA_EUR,
            oldBalance: this.findOldBalance(items),
            newBalance: this.findNewBalance(items),
            statementDate
        });
    }

    private findIban(items: PdfTextItemInterface[]): string | null {
        const ibanItem = items.find(item => item.text.startsWith(IBAN_LABEL_PREFIX));

        return ibanItem ? ibanItem.text.slice(IBAN_LABEL_PREFIX.length).trim() : null;
    }

    private findStatementDate(items: PdfTextItemInterface[]): Date | null {
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

        return null;
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
