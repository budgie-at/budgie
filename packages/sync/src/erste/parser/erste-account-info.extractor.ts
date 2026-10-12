import { isValid } from 'date-fns/isValid';
import * as Result from 'effect/Result';

import { isDefined } from '@rnw-community/shared';

import { ERSTE_NEW_BALANCE_PREFIX } from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const IBAN_LABEL_PREFIX = 'IBAN: ';
const STATEMENT_FOOTER_REGEX = /^AT\d{18,20}\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/u;
const AMOUNT_ONLY_REGEX = /^(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

const hasStatementDate = (items: PdfTextItemInterface[]): boolean =>
    items.some(item => {
        const match = STATEMENT_FOOTER_REGEX.exec(item.text);

        if (!isDefined(match)) {
            return false;
        }

        const [, day, month, year, hours, minutes] = match.map(Number);

        return isValid(new Date(year, month - 1, day, hours, minutes));
    });

const findNewBalance = (items: PdfTextItemInterface[]): number => {
    const balanceItem = items.find(item => item.text.startsWith(ERSTE_NEW_BALANCE_PREFIX));
    const match = isDefined(balanceItem) ? AMOUNT_ONLY_REGEX.exec(balanceItem.text.slice(ERSTE_NEW_BALANCE_PREFIX.length).trim()) : null;

    return isDefined(match) ? parseErsteAmount(match[1], match[2] === '-') : 0;
};

export const extractErsteAccountInfo = (items: PdfTextItemInterface[]): Result.Result<ErsteAccountInfoInterface, string> => {
    const ibanItem = items.find(item => item.text.startsWith(IBAN_LABEL_PREFIX));

    if (!isDefined(ibanItem)) {
        return Result.fail('Could not find IBAN in Erste PDF');
    }

    if (!hasStatementDate(items)) {
        return Result.fail('Could not find statement date in Erste PDF');
    }

    return Result.succeed({ iban: ibanItem.text.slice(IBAN_LABEL_PREFIX.length).trim(), newBalance: findNewBalance(items) });
};
