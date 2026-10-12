import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Result from 'effect/Result';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ERSTE_NEW_BALANCE_PREFIX } from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import { extractErsteAccountInfo } from './erste-account-info.extractor';
import { parseErsteCardMerchant } from './erste-card-merchant.parser';
import { groupErsteRows } from './erste-row.grouper';

import type { ErsteDateAmountInterface } from '../interface/erste-date-amount.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const COLUMN_HEADER_PREFIX = 'Buchungstext/Booking Text';
const DATE_AMOUNT_RIGHT_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;
const DATE_AMOUNT_TAIL_REGEX = /^(.+?)\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;
const PAGE_NOISE_PATTERNS: readonly RegExp[] = [
    /^AT\d{18,20}\s+\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\b/u,
    /^IBAN\s+Datum\/Date\s+Uhrzeit\/Time/u,
    /Auszug\/Statement\s+Seite\/Page/u
];

const joinTexts = (items: PdfTextItemInterface[]): string =>
    items
        .map(item => item.text.trim())
        .filter(isNotEmptyString)
        .join(' ')
        .trim();

const isPageNoise = (text: string): boolean => isNotEmptyString(text) && PAGE_NOISE_PATTERNS.some(pattern => pattern.test(text));

const buildDateAmount = (
    [day, month, year, amountString, sign]: string[],
    prefix: string
): Result.Result<ErsteDateAmountInterface, string> => {
    const date = parse(`${day}.${month}.${year}`, 'dd.MM.yyyy', new Date());

    if (!isValid(date)) {
        return Result.fail(`Invalid Erste transaction date: ${day}.${month}.${year}`);
    }

    date.setHours(12, 0, 0, 0);
    const isDebit = sign === '-';

    return Result.succeed({ date, amount: parseErsteAmount(amountString, isDebit), isCredit: !isDebit, prefix });
};

const parseAnchor = (leftText: string, rightText: string): Result.Result<ErsteDateAmountInterface, string> | null => {
    const rightMatch = DATE_AMOUNT_RIGHT_REGEX.exec(rightText);

    if (isDefined(rightMatch)) {
        return buildDateAmount(rightMatch.slice(1), leftText);
    }

    const inlineMatch = isNotEmptyString(rightText) ? null : DATE_AMOUNT_TAIL_REGEX.exec(leftText);

    return isDefined(inlineMatch) ? buildDateAmount(inlineMatch.slice(2), inlineMatch[1].trim()) : null;
};

const buildTransaction = (dateAmount: ErsteDateAmountInterface, continuationLines: string[]): ErsteRowInterface => {
    const description = continuationLines.join(' ').trim();
    const reference = isNotEmptyString(dateAmount.prefix) ? dateAmount.prefix : description;
    const merchant = continuationLines.map(parseErsteCardMerchant).find(isDefined);

    return {
        date: dateAmount.date,
        reference,
        description: isNotEmptyString(description) ? description : reference,
        amount: dateAmount.amount,
        isCredit: dateAmount.isCredit,
        ...(isDefined(merchant) && { city: merchant.city, countryAlpha2: merchant.countryAlpha2 })
    };
};

export const parseErste = (items: PdfTextItemInterface[]): Result.Result<ErsteParsedDataInterface, string> => {
    const account = extractErsteAccountInfo(items);

    if (Result.isFailure(account)) {
        return Result.fail(account.failure);
    }

    const transactions: ErsteRowInterface[] = [];
    let inSection = false;
    let current: ErsteDateAmountInterface | null = null;
    let continuationLines: string[] = [];

    const flush = (): void => {
        if (isDefined(current)) {
            transactions.push(buildTransaction(current, continuationLines));
            current = null;
        }
    };

    for (const row of groupErsteRows(items)) {
        const leftText = joinTexts(row.leftItems);
        const rightText = joinTexts(row.rightItems);

        if (leftText.startsWith(COLUMN_HEADER_PREFIX)) {
            inSection = true;
        } else if (leftText.startsWith(ERSTE_NEW_BALANCE_PREFIX) || rightText.startsWith(ERSTE_NEW_BALANCE_PREFIX)) {
            flush();
            inSection = false;
        } else if (inSection && !isPageNoise(leftText) && !isPageNoise(rightText)) {
            const anchor = parseAnchor(leftText, rightText);

            if (isDefined(anchor) && Result.isFailure(anchor)) {
                return Result.fail(anchor.failure);
            }

            if (isDefined(anchor)) {
                flush();
                current = anchor.success;
                continuationLines = [];
            } else if (isDefined(current) && isNotEmptyString(leftText)) {
                continuationLines.push(leftText);
            }
        }
    }
    flush();

    return Result.succeed({ account: account.success, transactions });
};
