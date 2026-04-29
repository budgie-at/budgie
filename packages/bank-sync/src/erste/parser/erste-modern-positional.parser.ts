import { isValid, parse } from 'date-fns';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_MODERN_PAGE_NOISE_PATTERNS } from '../constant/erste.constant';
import { extractErsteAccountInfo } from '../util/extract-erste-account-info.util';
import { groupPdfItemsIntoRows } from '../util/group-pdf-items-into-rows.util';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import { ParserState } from './parser-state';

import type { DateAmountInputInterface } from '../interface/date-amount-input.interface';
import type { DateAmountInterface } from '../interface/date-amount.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { InlineDateAmountInterface } from '../interface/inline-date-amount.interface';
import type { PageRowInterface } from '../interface/page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const COLUMN_HEADER_PREFIX = 'Buchungstext/Booking Text';
const NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand';

const DATE_AMOUNT_RIGHT_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;
const DATE_AMOUNT_TAIL_REGEX = /^(.+?)\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

const joinTexts = (items: PdfTextItemInterface[]): string =>
    items
        .map(item => item.text.trim())
        .filter(isNotEmptyString)
        .join(' ')
        .trim();

const isEndOfSection = (leftText: string, rightText: string): boolean =>
    leftText.startsWith(NEW_BALANCE_INLINE_PREFIX) || rightText.startsWith(NEW_BALANCE_INLINE_PREFIX);

const isPageNoise = (text: string): boolean => {
    if (!isNotEmptyString(text)) {
        return false;
    }
    
return ERSTE_MODERN_PAGE_NOISE_PATTERNS.some(pattern => pattern.test(text));
};

const buildDateAmount = (input: DateAmountInputInterface): DateAmountInterface => {
    const date = parse(`${input.day}.${input.month}.${input.year}`, 'dd.MM.yyyy', new Date());

    if (!isValid(date)) {
        throw new BankSyncError(
            BankSyncErrorCodeEnum.INVALID_RESPONSE,
            `Invalid Erste transaction date: ${input.day}.${input.month}.${input.year}`,
            BankProviderEnum.ERSTE
        );
    }

    date.setHours(12, 0, 0, 0);

    return {
        date,
        amount: parseErsteAmount(input.amountStr, input.isDebit),
        isCredit: !input.isDebit
    };
};

const parseRightDateAmount = (text: string): DateAmountInterface | null => {
    const match = DATE_AMOUNT_RIGHT_REGEX.exec(text);

    if (!match) {
        return null;
    }

    const [, day, month, year, amountStr, sign] = match;
    
return buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
};

const parseInlineDateAmount = (text: string): InlineDateAmountInterface | null => {
    const match = DATE_AMOUNT_TAIL_REGEX.exec(text);

    if (!match) {
        return null;
    }

    const [, prefix, day, month, year, amountStr, sign] = match;
    const dateAmount = buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
    
return { ...dateAmount, prefix: prefix.trim() };
};

const tryHandleSectionTransition = (state: ParserState, leftText: string, rightText: string): boolean => {
    if (leftText.startsWith(COLUMN_HEADER_PREFIX)) {
        state.enterSection();
        
return true;
    }

    if (isEndOfSection(leftText, rightText)) {
        state.exitSection();
        
return true;
    }

    return false;
};

const tryHandleInlineAnchor = (state: ParserState, leftText: string, rightText: string): boolean => {
    if (isNotEmptyString(rightText) || !isNotEmptyString(leftText)) {
        return false;
    }

    const inlineAnchor = parseInlineDateAmount(leftText);

    if (!isDefined(inlineAnchor)) {
        return false;
    }

    state.startTransaction(inlineAnchor, inlineAnchor.prefix);
    
return true;
};

const tryHandleAnchor = (state: ParserState, leftText: string, rightText: string): boolean => {
    const rightAnchor = parseRightDateAmount(rightText);

    if (isDefined(rightAnchor)) {
        state.startTransaction(rightAnchor, leftText);
        
return true;
    }

    return tryHandleInlineAnchor(state, leftText, rightText);
};

const processRow = (state: ParserState, row: PageRowInterface): void => {
    const leftText = joinTexts(row.leftItems);
    const rightText = joinTexts(row.rightItems);

    if (tryHandleSectionTransition(state, leftText, rightText)) {
        return;
    }
    if (!state.isInSection()) {
        return;
    }
    if (isPageNoise(leftText) || isPageNoise(rightText)) {
        return;
    }
    if (tryHandleAnchor(state, leftText, rightText)) {
        return;
    }
    if (state.hasCurrent() && isNotEmptyString(leftText)) {
        state.addContinuationLine(leftText);
    }
};

export class ErsteModernPositionalParser {
    parse(items: PdfTextItemInterface[]): ErsteParsedDataInterface {
        const account = extractErsteAccountInfo(items);
        const rows = groupPdfItemsIntoRows(items);
        const state = new ParserState();

        for (const row of rows) {
            processRow(state, row);
        }
        state.flush();

        return { account, transactions: state.getTransactions() };
    }
}
