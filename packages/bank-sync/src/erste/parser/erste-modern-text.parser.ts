import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { BankSyncError } from '../../core/error/bank-sync.error';
import {
    ERSTE_MODERN_BALANCE_AMOUNT_REGEX,
    ERSTE_MODERN_BALANCE_SEARCH_LINES_LIMIT,
    ERSTE_MODERN_END_MARKER,
    ERSTE_MODERN_FORMAT_MARKER,
    ERSTE_MODERN_FULL_DATE_REGEX,
    ERSTE_MODERN_INLINE_TRANSACTION_REGEX,
    ERSTE_MODERN_TRANSACTION_DATE_REGEX
} from '../constant/erste.constant';
import { appendErsteModernTransactionLine } from '../util/append-erste-modern-transaction-line.util';
import { createErsteModernTransaction } from '../util/create-erste-modern-transaction.util';
import { findNextNonEmptyLine } from '../util/find-next-non-empty-line.util';
import { parseErsteAmount } from '../util/parse-erste-amount.util';
import { parseErsteModernDateAmount } from '../util/parse-erste-modern-date-amount.util';

import { ErsteBaseTextParser } from './erste-base-text.parser';

import type { ErsteModernInlineTransactionStateInterface } from '../interface/erste-modern-inline-transaction-state.interface';
import type { ErsteModernParseContextInterface } from '../interface/erste-modern-parse-context.interface';
import type { ErsteModernStandardTransactionStateInterface } from '../interface/erste-modern-standard-transaction-state.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

export class ErsteModernTextParser extends ErsteBaseTextParser {
    parse(text: string): ErsteParsedDataInterface {
        try {
            const account = this.extractAccountInfo(text, 'Alter Kontostand', ['Neuer Kontostand']);
            const transactions = this.parseTransactions(text);

            return { account, transactions };
        } catch (error) {
            if (error instanceof BankSyncError) {
                throw error;
            }

            throw this.createParseError('Failed to parse Erste modern PDF text', error);
        }
    }

    protected extractBalance(text: string, keyword: string): number {
        const lines = text.split('\n');

        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index].trim();

            if (line.includes(keyword)) {
                const balance = this.parseBalanceFromLine(line, keyword, lines, index);

                if (isDefined(balance)) {
                    return balance;
                }
            }
        }

        return 0;
    }

    private parseTransactions(text: string): ErsteRowInterface[] {
        const transactionLines = this.extractTransactionSection(text);

        return this.buildTransactionsFromLines(transactionLines);
    }

    private extractTransactionSection(text: string): string[] {
        const lines = text.split('\n');
        const sectionLines: string[] = [];
        let isInSection = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.includes(ERSTE_MODERN_FORMAT_MARKER)) {
                isInSection = true;
            } else if (isInSection && trimmed.includes(ERSTE_MODERN_END_MARKER)) {
                isInSection = false;
            } else if (isInSection) {
                sectionLines.push(trimmed);
            }
        }

        return sectionLines;
    }

    private buildTransactionsFromLines(lines: string[]): ErsteRowInterface[] {
        const context: ErsteModernParseContextInterface = {
            transactions: [],
            pendingLeadingLines: [],
            currentTransaction: null,
            isIgnoringNoteBlock: false
        };

        for (let index = 0; index < lines.length; index += 1) {
            this.processTransactionLine(context, lines, index);
        }

        this.finalizeCurrentTransaction(context);

        return context.transactions;
    }

    private parseStandardTransactionState(
        match: RegExpMatchArray,
        leadingLines: string[]
    ): ErsteModernStandardTransactionStateInterface | null {
        const [, day, month, year, amount, debitMarker] = match;

        const isDebit = debitMarker === '-';
        const parsedDateAndAmount = parseErsteModernDateAmount({ day, month, year, amount, isDebit });

        return {
            kind: 'standard',
            date: parsedDateAndAmount.date,
            amount: parsedDateAndAmount.amount,
            isCredit: parsedDateAndAmount.isCredit,
            leadingLines,
            trailingLines: []
        };
    }

    private parseInlineTransactionState(match: RegExpMatchArray): ErsteModernInlineTransactionStateInterface | null {
        const [, description, day, month, year, amount, debitMarker] = match;

        if (
            !isNotEmptyString(description) ||
            !isNotEmptyString(day) ||
            !isNotEmptyString(month) ||
            !isNotEmptyString(year) ||
            !isNotEmptyString(amount)
        ) {
            return null;
        }

        const isDebit = debitMarker === '-';
        const parsedDateAndAmount = parseErsteModernDateAmount({ day, month, year, amount, isDebit });

        return {
            kind: 'inline',
            date: parsedDateAndAmount.date,
            reference: description,
            amount: parsedDateAndAmount.amount,
            isCredit: parsedDateAndAmount.isCredit,
            continuationLines: []
        };
    }

    private isNonTransactionDateLine(line: string): boolean {
        if (this.isTransactionLine(line)) {
            return false;
        }

        return ERSTE_MODERN_FULL_DATE_REGEX.test(line);
    }

    private isTransactionLine(line: string): boolean {
        return ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(line) || ERSTE_MODERN_INLINE_TRANSACTION_REGEX.test(line);
    }

    private isPreludeForNextStandardTransaction(line: string, nextLine: string | null): boolean {
        if (!isNotEmptyString(line) || !isNotEmptyString(nextLine)) {
            return false;
        }

        return ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(nextLine);
    }

    private parseBalanceFromLine(line: string, keyword: string, lines: string[], lineIndex: number): number | null {
        const keywordEndIndex = line.indexOf(keyword) + keyword.length;
        const afterKeyword = line.slice(keywordEndIndex).trim();

        if (isNotEmptyString(afterKeyword)) {
            const amountMatch = afterKeyword.match(ERSTE_MODERN_BALANCE_AMOUNT_REGEX);

            if (isDefined(amountMatch)) {
                return parseErsteAmount(amountMatch[0], false);
            }
        }

        return this.findBalanceInNextLines(lines, lineIndex);
    }

    private findBalanceInNextLines(lines: string[], startIndex: number): number | null {
        for (let offset = 1; offset <= ERSTE_MODERN_BALANCE_SEARCH_LINES_LIMIT; offset += 1) {
            const nextLineIndex = startIndex + offset;

            if (nextLineIndex >= lines.length) {
                break;
            }

            const nextLine = lines[nextLineIndex].trim();

            if (ERSTE_MODERN_BALANCE_AMOUNT_REGEX.test(nextLine)) {
                return parseErsteAmount(nextLine, false);
            }
        }

        return null;
    }

    private processTransactionLine(context: ErsteModernParseContextInterface, lines: string[], index: number): void {
        const trimmedLine = lines[index].trim();
        const nextLine = findNextNonEmptyLine(lines, index + 1);

        if (!isNotEmptyString(trimmedLine)) {
            return;
        }

        if (this.handleMatchedTransactionLine(context, trimmedLine)) {
            return;
        }

        if (this.handleNoteBlockLine(context, trimmedLine)) {
            return;
        }
        this.handleContentLine(context, trimmedLine, nextLine);
    }

    private handleMatchedTransactionLine(context: ErsteModernParseContextInterface, trimmedLine: string): boolean {
        const standardMatch = trimmedLine.match(ERSTE_MODERN_TRANSACTION_DATE_REGEX);

        if (isDefined(standardMatch)) {
            this.startStandardTransaction(context, standardMatch);

            return true;
        }

        const inlineMatch = trimmedLine.match(ERSTE_MODERN_INLINE_TRANSACTION_REGEX);

        if (isDefined(inlineMatch)) {
            this.startInlineTransaction(context, inlineMatch);

            return true;
        }

        return false;
    }

    private startStandardTransaction(context: ErsteModernParseContextInterface, match: RegExpMatchArray): void {
        this.finalizeCurrentTransaction(context);
        context.currentTransaction = this.parseStandardTransactionState(match, context.pendingLeadingLines);
        context.pendingLeadingLines = [];
        context.isIgnoringNoteBlock = false;
    }

    private startInlineTransaction(context: ErsteModernParseContextInterface, match: RegExpMatchArray): void {
        this.finalizeCurrentTransaction(context);
        context.currentTransaction = this.parseInlineTransactionState(match);
        context.pendingLeadingLines = [];
        context.isIgnoringNoteBlock = false;
    }

    private handleNoteBlockLine(context: ErsteModernParseContextInterface, trimmedLine: string): boolean {
        if (!this.isNonTransactionDateLine(trimmedLine)) {
            return false;
        }

        this.finalizeCurrentTransaction(context);
        context.pendingLeadingLines = [];
        context.isIgnoringNoteBlock = true;

        return true;
    }

    private handleContentLine(context: ErsteModernParseContextInterface, trimmedLine: string, nextLine: string | null): void {
        if (context.isIgnoringNoteBlock) {
            return;
        }

        const activeTransaction = context.currentTransaction;
        if (!isDefined(activeTransaction)) {
            context.pendingLeadingLines.push(trimmedLine);

            return;
        }

        if (this.isPreludeForNextStandardTransaction(trimmedLine, nextLine)) {
            this.finalizeCurrentTransaction(context);
            context.pendingLeadingLines = [trimmedLine];

            return;
        }

        appendErsteModernTransactionLine(activeTransaction, trimmedLine);
    }

    private finalizeCurrentTransaction(context: ErsteModernParseContextInterface): void {
        if (!isDefined(context.currentTransaction)) {
            return;
        }
        context.transactions.push(createErsteModernTransaction(context.currentTransaction));
        context.currentTransaction = null;
    }
}
