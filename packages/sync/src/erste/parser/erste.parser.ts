import { Log } from '@budgie/logger';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncErrorCodeEnum } from '../../core/enum/sync-error-code.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncError } from '../../core/error/sync.error';
import { ERSTE_PAGE_NOISE_PATTERNS } from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import { ersteAccountInfoExtractor } from './erste-account-info.extractor';
import { ersteCardMerchantParser } from './erste-card-merchant.parser';
import { ersteRowGrouper } from './erste-row.grouper';

import type { ErsteDateAmountInputInterface } from '../interface/erste-date-amount-input.interface';
import type { ErsteDateAmountInterface } from '../interface/erste-date-amount.interface';
import type { ErsteInlineDateAmountInterface } from '../interface/erste-inline-date-amount.interface';
import type { ErstePageRowInterface } from '../interface/erste-page-row.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

class ErsteParser {
    private static readonly COLUMN_HEADER_PREFIX = 'Buchungstext/Booking Text';
    private static readonly NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand';
    private static readonly DATE_AMOUNT_RIGHT_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;
    private static readonly DATE_AMOUNT_TAIL_REGEX = /^(.+?)\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

    private inSection = false;
    private currentDateAmount: ErsteDateAmountInterface | null = null;
    private currentPrimary = '';
    private continuationLines: string[] = [];
    private transactions: ErsteRowInterface[] = [];

    @Log(
        items => `enter itemCount=${items.length}`,
        (result, items) => `done itemCount=${items.length} iban=${result.account.iban} transactionCount=${result.transactions.length}`,
        (error, items) => `throw itemCount=${items.length} error=${getErrorMessage(error)}`
    )
    parse(items: PdfTextItemInterface[]): ErsteParsedDataInterface {
        const account = ersteAccountInfoExtractor.extract(items);
        const rows = ersteRowGrouper.group(items);
        this.inSection = false;
        this.currentDateAmount = null;
        this.transactions = [];

        for (const row of rows) {
            this.processRow(row);
        }
        this.flushTransaction();

        return { account, transactions: this.transactions };
    }

    private processRow(row: ErstePageRowInterface): void {
        const leftText = this.joinTexts(row.leftItems);
        const rightText = this.joinTexts(row.rightItems);

        if (this.tryHandleSectionTransition(leftText, rightText)) {
            return;
        }
        if (!this.inSection) {
            return;
        }
        if (this.isPageNoise(leftText) || this.isPageNoise(rightText)) {
            return;
        }
        if (this.tryHandleAnchor(leftText, rightText)) {
            return;
        }
        if (isDefined(this.currentDateAmount) && isNotEmptyString(leftText)) {
            this.continuationLines.push(leftText);
        }
    }

    private tryHandleSectionTransition(leftText: string, rightText: string): boolean {
        if (leftText.startsWith(ErsteParser.COLUMN_HEADER_PREFIX)) {
            this.inSection = true;

            return true;
        }

        if (this.isEndOfSection(leftText, rightText)) {
            this.flushTransaction();
            this.inSection = false;

            return true;
        }

        return false;
    }

    private tryHandleAnchor(leftText: string, rightText: string): boolean {
        const rightAnchor = this.parseRightDateAmount(rightText);

        if (isDefined(rightAnchor)) {
            this.startTransaction(rightAnchor, leftText);

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

        this.startTransaction(inlineAnchor, inlineAnchor.prefix);

        return true;
    }

    private startTransaction(dateAmount: ErsteDateAmountInterface, primary: string): void {
        this.flushTransaction();
        this.currentDateAmount = dateAmount;
        this.currentPrimary = primary;
        this.continuationLines = [];
    }

    private flushTransaction(): void {
        if (isDefined(this.currentDateAmount)) {
            this.transactions.push(this.buildTransaction(this.currentDateAmount));
            this.currentDateAmount = null;
        }
    }

    private buildTransaction(dateAmount: ErsteDateAmountInterface): ErsteRowInterface {
        const description = this.continuationLines.join(' ').trim();
        const reference = isNotEmptyString(this.currentPrimary) ? this.currentPrimary : description;
        const finalDescription = isNotEmptyString(description) ? description : reference;

        return {
            date: dateAmount.date,
            reference,
            description: finalDescription,
            details: '',
            amount: dateAmount.amount,
            isCredit: dateAmount.isCredit,
            ...this.findMerchantInfo()
        };
    }

    private findMerchantInfo(): Partial<Pick<ErsteRowInterface, 'city' | 'countryAlpha2'>> {
        for (const line of this.continuationLines) {
            const merchant = ersteCardMerchantParser.parse(line);

            if (isDefined(merchant)) {
                return { city: merchant.city, countryAlpha2: merchant.countryAlpha2 };
            }
        }

        return {};
    }

    private joinTexts(items: PdfTextItemInterface[]): string {
        return items
            .map(item => item.text.trim())
            .filter(isNotEmptyString)
            .join(' ')
            .trim();
    }

    private isEndOfSection(leftText: string, rightText: string): boolean {
        return leftText.startsWith(ErsteParser.NEW_BALANCE_INLINE_PREFIX) || rightText.startsWith(ErsteParser.NEW_BALANCE_INLINE_PREFIX);
    }

    private isPageNoise(text: string): boolean {
        if (!isNotEmptyString(text)) {
            return false;
        }

        return ERSTE_PAGE_NOISE_PATTERNS.some(pattern => pattern.test(text));
    }

    private parseRightDateAmount(text: string): ErsteDateAmountInterface | null {
        const match = ErsteParser.DATE_AMOUNT_RIGHT_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, day, month, year, amountStr, sign] = match;

        return this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
    }

    private parseInlineDateAmount(text: string): ErsteInlineDateAmountInterface | null {
        const match = ErsteParser.DATE_AMOUNT_TAIL_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, prefix, day, month, year, amountStr, sign] = match;
        const dateAmount = this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });

        return { ...dateAmount, prefix: prefix.trim() };
    }

    private buildDateAmount(input: ErsteDateAmountInputInterface): ErsteDateAmountInterface {
        const date = parse(`${input.day}.${input.month}.${input.year}`, 'dd.MM.yyyy', new Date());

        if (!isValid(date)) {
            throw new SyncError(
                SyncErrorCodeEnum.INVALID_RESPONSE,
                `Invalid Erste transaction date: ${input.day}.${input.month}.${input.year}`,
                SyncProviderEnum.ERSTE
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

export const ersteParser = new ErsteParser();
