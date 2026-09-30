import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Result from 'effect/Result';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

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

    parse(items: PdfTextItemInterface[]): Result.Result<ErsteParsedDataInterface, string> {
        const account = ersteAccountInfoExtractor.extract(items);

        if (Result.isFailure(account)) {
            return Result.fail(account.failure);
        }

        this.inSection = false;
        this.currentDateAmount = null;
        this.transactions = [];

        return Result.map(this.processRows(ersteRowGrouper.group(items)), transactions => ({ account: account.success, transactions }));
    }

    private processRows(rows: ErstePageRowInterface[]): Result.Result<ErsteRowInterface[], string> {
        for (const row of rows) {
            const processed = this.processRow(row);

            if (Result.isFailure(processed)) {
                return Result.fail(processed.failure);
            }
        }
        this.flushTransaction();

        return Result.succeed(this.transactions);
    }

    private processRow(row: ErstePageRowInterface): Result.Result<void, string> {
        const leftText = this.joinTexts(row.leftItems);
        const rightText = this.joinTexts(row.rightItems);

        if (this.tryHandleSectionTransition(leftText, rightText)) {
            return Result.void;
        }
        if (!this.inSection) {
            return Result.void;
        }
        if (this.isPageNoise(leftText) || this.isPageNoise(rightText)) {
            return Result.void;
        }

        return this.processContentRow(leftText, rightText);
    }

    private processContentRow(leftText: string, rightText: string): Result.Result<void, string> {
        const anchored = this.tryHandleAnchor(leftText, rightText);

        if (Result.isFailure(anchored)) {
            return Result.fail(anchored.failure);
        }
        if (!anchored.success && isDefined(this.currentDateAmount) && isNotEmptyString(leftText)) {
            this.continuationLines.push(leftText);
        }

        return Result.void;
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

    private tryHandleAnchor(leftText: string, rightText: string): Result.Result<boolean, string> {
        const rightAnchor = this.parseRightDateAmount(rightText);

        if (!isDefined(rightAnchor)) {
            return this.tryHandleInlineAnchor(leftText, rightText);
        }

        if (Result.isFailure(rightAnchor)) {
            return Result.fail(rightAnchor.failure);
        }

        this.startTransaction(rightAnchor.success, leftText);

        return Result.succeed(true);
    }

    private tryHandleInlineAnchor(leftText: string, rightText: string): Result.Result<boolean, string> {
        if (isNotEmptyString(rightText) || !isNotEmptyString(leftText)) {
            return Result.succeed(false);
        }

        const inlineAnchor = this.parseInlineDateAmount(leftText);

        if (!isDefined(inlineAnchor)) {
            return Result.succeed(false);
        }

        if (Result.isFailure(inlineAnchor)) {
            return Result.fail(inlineAnchor.failure);
        }

        this.startTransaction(inlineAnchor.success, inlineAnchor.success.prefix);

        return Result.succeed(true);
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

    private parseRightDateAmount(text: string): Result.Result<ErsteDateAmountInterface, string> | null {
        const match = ErsteParser.DATE_AMOUNT_RIGHT_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, day, month, year, amountStr, sign] = match;

        return this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' });
    }

    private parseInlineDateAmount(text: string): Result.Result<ErsteInlineDateAmountInterface, string> | null {
        const match = ErsteParser.DATE_AMOUNT_TAIL_REGEX.exec(text);

        if (!match) {
            return null;
        }

        const [, prefix, day, month, year, amountStr, sign] = match;

        return Result.map(this.buildDateAmount({ day, month, year, amountStr, isDebit: sign === '-' }), dateAmount => ({
            ...dateAmount,
            prefix: prefix.trim()
        }));
    }

    private buildDateAmount(input: ErsteDateAmountInputInterface): Result.Result<ErsteDateAmountInterface, string> {
        const date = parse(`${input.day}.${input.month}.${input.year}`, 'dd.MM.yyyy', new Date());

        if (!isValid(date)) {
            return Result.fail(`Invalid Erste transaction date: ${input.day}.${input.month}.${input.year}`);
        }

        date.setHours(12, 0, 0, 0);

        return Result.succeed({
            date,
            amount: parseErsteAmount(input.amountStr, input.isDebit),
            isCredit: !input.isDebit
        });
    }
}

export const ersteParser = new ErsteParser();
