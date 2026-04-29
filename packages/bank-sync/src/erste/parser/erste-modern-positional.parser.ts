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

export class ErsteModernPositionalParser {
    private state: ParserState = new ParserState();

    parse(items: PdfTextItemInterface[]): ErsteParsedDataInterface {
        const account = extractErsteAccountInfo(items);
        const rows = groupPdfItemsIntoRows(items);
        this.state = new ParserState();

        for (const row of rows) {
            this.processRow(row);
        }
        this.state.flush();

        return { account, transactions: this.state.getTransactions() };
    }

    private processRow(row: PageRowInterface): void {
        const leftText = this.joinTexts(row.leftItems);
        const rightText = this.joinTexts(row.rightItems);

        if (this.tryHandleSectionTransition(leftText, rightText)) {
            return;
        }
        if (!this.state.isInSection()) {
            return;
        }
        if (this.isPageNoise(leftText) || this.isPageNoise(rightText)) {
            return;
        }
        if (this.tryHandleAnchor(leftText, rightText)) {
            return;
        }
        if (this.state.hasCurrent() && isNotEmptyString(leftText)) {
            this.state.addContinuationLine(leftText);
        }
    }

    private tryHandleSectionTransition(leftText: string, rightText: string): boolean {
        if (leftText.startsWith(COLUMN_HEADER_PREFIX)) {
            this.state.enterSection();
            
return true;
        }

        if (this.isEndOfSection(leftText, rightText)) {
            this.state.exitSection();
            
return true;
        }

        return false;
    }

    private tryHandleAnchor(leftText: string, rightText: string): boolean {
        const rightAnchor = this.parseRightDateAmount(rightText);

        if (isDefined(rightAnchor)) {
            this.state.startTransaction(rightAnchor, leftText);
            
return true;
        }

        return this.tryHandleInlineAnchor(leftText, rightText);
    }

    private tryHandleInlineAnchor(leftText: string, rightText: string): boolean {
        if (isNotEmptyString(rightText) || !isNotEmptyString(leftText)) {
            return false;
        }

        const inlineAnchor = this.parseInlineDateAmount(leftText);

        if (!isDefined(inlineAnchor)) {
            return false;
        }

        this.state.startTransaction(inlineAnchor, inlineAnchor.prefix);
        
return true;
    }

    private joinTexts(items: PdfTextItemInterface[]): string {
        return items
            .map(item => item.text.trim())
            .filter(isNotEmptyString)
            .join(' ')
            .trim();
    }

    private isEndOfSection(leftText: string, rightText: string): boolean {
        return leftText.startsWith(NEW_BALANCE_INLINE_PREFIX) || rightText.startsWith(NEW_BALANCE_INLINE_PREFIX);
    }

    private isPageNoise(text: string): boolean {
        if (!isNotEmptyString(text)) {
            return false;
        }
        
return ERSTE_MODERN_PAGE_NOISE_PATTERNS.some(pattern => pattern.test(text));
    }

    private parseRightDateAmount(text: string): DateAmountInterface | null {
        const match = DATE_AMOUNT_RIGHT_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, day, month, year, amountStr, sign] = match;
        
return this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
    }

    private parseInlineDateAmount(text: string): InlineDateAmountInterface | null {
        const match = DATE_AMOUNT_TAIL_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, prefix, day, month, year, amountStr, sign] = match;
        const dateAmount = this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
        
return { ...dateAmount, prefix: prefix.trim() };
    }

    private buildDateAmount(input: DateAmountInputInterface): DateAmountInterface {
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
    }
}
