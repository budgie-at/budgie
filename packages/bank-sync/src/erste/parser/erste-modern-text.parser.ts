/* eslint-disable max-lines -- Parser intentionally keeps coupled Erste layout normalization and reduction in one place */
import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankSyncError } from '../../core/error/bank-sync.error';
import {
    ERSTE_MODERN_BALANCE_AMOUNT_REGEX,
    ERSTE_MODERN_BALANCE_SEARCH_LINES_LIMIT,
    ERSTE_MODERN_END_MARKER,
    ERSTE_MODERN_FORMAT_MARKER,
    ERSTE_MODERN_FULL_DATE_REGEX,
    ERSTE_MODERN_INLINE_TRANSACTION_TAIL_REGEX,
    ERSTE_MODERN_NOTE_HEADER_MARKERS,
    ERSTE_MODERN_PAGE_NOISE_PATTERNS,
    ERSTE_MODERN_TRANSACTION_DATE_REGEX
} from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';
import { parseErsteCardMerchant } from '../util/parse-erste-card-merchant.util';
import { parseErsteModernDateAmount } from '../util/parse-erste-modern-date-amount.util';

import { ErsteBaseTextParser } from './erste-base-text.parser';

import type { ErsteModernInlineTransactionStateInterface } from '../interface/erste-modern-inline-transaction-state.interface';
import type { ErsteModernStandardTransactionStateInterface } from '../interface/erste-modern-standard-transaction-state.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

interface ErsteGroupedTransactionBlockInterface {
    readonly reference: string;
    readonly continuationLines: string[];
}

interface ErsteModernInlineTransactionMatchInterface {
    readonly description: string;
    readonly day: string;
    readonly month: string;
    readonly year: string;
    readonly amount: string;
    readonly debitMarker: string | undefined;
}

interface ErsteModernParseStateInterface {
    readonly transactions: ErsteRowInterface[];
    currentTransaction: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface | null;
    pendingLeadingLines: string[];
    isIgnoringNoteBlock: boolean;
}

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
        const normalizedLines = this.normalizeTransactionSectionLines(transactionLines);
        const transactions = this.buildTransactionsFromLines(normalizedLines);

        this.validateTransactions(transactions);

        return transactions;
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
            } else if (isInSection && isNotEmptyString(trimmed) && !this.isPageNoiseLine(trimmed)) {
                sectionLines.push(trimmed);
            }
        }

        return sectionLines;
    }

    private normalizeTransactionSectionLines(lines: string[]): string[] {
        const groupedDateTailStartIndex = this.findGroupedDateTailStartIndex(lines);

        if (!isDefined(groupedDateTailStartIndex)) {
            return lines;
        }

        const groupedContentBlocks = this.buildGroupedTransactionBlocks(lines.slice(0, groupedDateTailStartIndex));
        const dateRows = lines.slice(groupedDateTailStartIndex);

        if (groupedContentBlocks.length !== dateRows.length) {
            throw this.createParseError(
                `Grouped Erste layout mismatch: ${groupedContentBlocks.length} content blocks for ${dateRows.length} dated rows`
            );
        }

        return groupedContentBlocks.flatMap((groupedContentBlock, index) => [
            groupedContentBlock.reference,
            dateRows[index],
            ...groupedContentBlock.continuationLines
        ]);
    }

    private findGroupedDateTailStartIndex(lines: string[]): number | null {
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];

            if (ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(line)) {
                const remainingLines = lines.slice(index);
                const standardTransactionLineCount = remainingLines.filter(currentLine =>
                    ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(currentLine)
                ).length;
                const containsOnlyDateRows = remainingLines.every(currentLine => ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(currentLine));
                const containsLeadingContent = lines
                    .slice(0, index)
                    .some(
                        currentLine =>
                            !ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(currentLine) &&
                            !this.isInlineTransactionLine(currentLine) &&
                            !this.isNoteHeaderLine(currentLine)
                    );

                if (containsOnlyDateRows && standardTransactionLineCount >= 2 && containsLeadingContent) {
                    return index;
                }
            }
        }

        return null;
    }

    private buildGroupedTransactionBlocks(lines: string[]): ErsteGroupedTransactionBlockInterface[] {
        const blocks: ErsteGroupedTransactionBlockInterface[] = [];
        let currentLines: string[] = [];

        for (const line of lines) {
            if (!this.isNoteHeaderLine(line) && !this.isStandaloneDateLine(line)) {
                if (this.shouldStartNewGroupedBlock(line, currentLines)) {
                    blocks.push(this.createGroupedTransactionBlock(currentLines));
                    currentLines = [line];
                } else {
                    currentLines.push(line);
                }
            }
        }

        if (isNotEmptyArray(currentLines)) {
            blocks.push(this.createGroupedTransactionBlock(currentLines));
        }

        return blocks;
    }

    private shouldStartNewGroupedBlock(line: string, currentLines: string[]): boolean {
        if (!isNotEmptyArray(currentLines)) {
            return false;
        }

        if (this.normalizeWhitespace(line) === this.normalizeWhitespace(currentLines[0])) {
            return false;
        }

        return this.isGroupedBlockReferenceLine(line);
    }

    private createGroupedTransactionBlock(lines: string[]): ErsteGroupedTransactionBlockInterface {
        const reference = this.normalizeWhitespace(lines[0]);
        const continuationLines = lines
            .slice(1)
            .map(line => this.normalizeWhitespace(line))
            .filter(isNotEmptyString);

        return { reference, continuationLines };
    }

    private buildTransactionsFromLines(lines: string[]): ErsteRowInterface[] {
        const state: ErsteModernParseStateInterface = {
            transactions: [],
            currentTransaction: null,
            pendingLeadingLines: [],
            isIgnoringNoteBlock: false
        };

        for (let index = 0; index < lines.length; index += 1) {
            const line = this.normalizeWhitespace(lines[index]);

            if (isNotEmptyString(line)) {
                const nextLine = this.findNextNonEmptyLine(lines, index + 1);

                this.processTransactionLine(state, line, nextLine);
            }
        }

        this.finalizeCurrentTransaction(state);

        return state.transactions;
    }

    /* eslint-disable-next-line max-statements -- Parser routing keeps note, prelude, and transaction transitions together */
    private processTransactionLine(state: ErsteModernParseStateInterface, line: string, nextLine: string | null): void {
        const standardMatch = line.match(ERSTE_MODERN_TRANSACTION_DATE_REGEX);

        if (isDefined(standardMatch)) {
            this.startStandardTransaction(state, standardMatch);

            return;
        }

        const inlineMatch = this.parseInlineTransactionMatch(line);

        if (isDefined(inlineMatch)) {
            this.startInlineTransaction(state, inlineMatch);

            return;
        }

        if (this.isNoteHeaderLine(line)) {
            this.finalizeCurrentTransaction(state);
            state.pendingLeadingLines = [];
            state.isIgnoringNoteBlock = true;

            return;
        }

        if (state.isIgnoringNoteBlock) {
            if (this.isPreludeForNextStandardTransaction(line, nextLine)) {
                state.isIgnoringNoteBlock = false;
                state.pendingLeadingLines = [line];
            }

            return;
        }

        if (!isDefined(state.currentTransaction)) {
            state.pendingLeadingLines.push(line);

            return;
        }

        if (this.isPreludeForNextStandardTransaction(line, nextLine)) {
            this.finalizeCurrentTransaction(state);
            state.pendingLeadingLines = [line];

            return;
        }

        this.appendTransactionLine(state.currentTransaction, line);
    }

    private startStandardTransaction(state: ErsteModernParseStateInterface, match: RegExpMatchArray): void {
        this.finalizeCurrentTransaction(state);
        state.currentTransaction = this.parseStandardTransactionState(match, state.pendingLeadingLines);
        state.pendingLeadingLines = [];
        state.isIgnoringNoteBlock = false;
    }

    private startInlineTransaction(state: ErsteModernParseStateInterface, match: ErsteModernInlineTransactionMatchInterface): void {
        this.finalizeCurrentTransaction(state);
        state.currentTransaction = this.parseInlineTransactionState(match);
        state.pendingLeadingLines = [];
        state.isIgnoringNoteBlock = false;
    }

    private parseStandardTransactionState(match: RegExpMatchArray, leadingLines: string[]): ErsteModernStandardTransactionStateInterface {
        const [, day, month, year, amount, debitMarker] = match;
        const parsedDateAndAmount = parseErsteModernDateAmount({
            day,
            month,
            year,
            amount,
            isDebit: debitMarker === '-'
        });

        return {
            kind: 'standard',
            date: parsedDateAndAmount.date,
            amount: parsedDateAndAmount.amount,
            isCredit: parsedDateAndAmount.isCredit,
            leadingLines,
            trailingLines: []
        };
    }

    private parseInlineTransactionState(match: ErsteModernInlineTransactionMatchInterface): ErsteModernInlineTransactionStateInterface {
        const { description, day, month, year, amount, debitMarker } = match;
        const parsedDateAndAmount = parseErsteModernDateAmount({
            day,
            month,
            year,
            amount,
            isDebit: debitMarker === '-'
        });

        return {
            kind: 'inline',
            date: parsedDateAndAmount.date,
            reference: this.normalizeWhitespace(description),
            amount: parsedDateAndAmount.amount,
            isCredit: parsedDateAndAmount.isCredit,
            continuationLines: []
        };
    }

    private isInlineTransactionLine(line: string): boolean {
        return isDefined(this.parseInlineTransactionMatch(line));
    }

    private parseInlineTransactionMatch(line: string): ErsteModernInlineTransactionMatchInterface | null {
        const tailMatch = ERSTE_MODERN_INLINE_TRANSACTION_TAIL_REGEX.exec(line);

        if (!isDefined(tailMatch) || !isDefined(tailMatch.index)) {
            return null;
        }

        const description = this.normalizeWhitespace(line.slice(0, tailMatch.index));

        if (!isNotEmptyString(description)) {
            return null;
        }

        const [, day, month, year, amount, debitMarker] = tailMatch;

        return {
            description,
            day,
            month,
            year,
            amount,
            debitMarker
        };
    }

    private appendTransactionLine(
        state: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface,
        line: string
    ): void {
        if (state.kind === 'standard') {
            state.trailingLines.push(line);
        } else {
            state.continuationLines.push(line);
        }
    }

    private finalizeCurrentTransaction(state: ErsteModernParseStateInterface): void {
        if (!isDefined(state.currentTransaction)) {
            return;
        }

        state.transactions.push(this.createTransaction(state.currentTransaction));
        state.currentTransaction = null;
    }

    private createTransaction(
        state: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface
    ): ErsteRowInterface {
        const { reference, rawDescription, details } = this.resolveTransactionParts(state);
        const merchantInfo = parseErsteCardMerchant(rawDescription);

        return {
            date: state.date,
            reference,
            description: merchantInfo?.merchant ?? rawDescription,
            details,
            amount: state.amount,
            isCredit: state.isCredit,
            ...(isDefined(merchantInfo) && { city: merchantInfo.city, countryAlpha2: merchantInfo.countryAlpha2 })
        };
    }

    private resolveTransactionParts(state: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface): {
        reference: string;
        rawDescription: string;
        details: string;
    } {
        if (state.kind === 'standard') {
            const reference = isNotEmptyArray(state.leadingLines) ? state.leadingLines[state.leadingLines.length - 1] : '';
            const rawDescription = isNotEmptyArray(state.trailingLines) ? state.trailingLines[0] : reference;
            const details = state.trailingLines.slice(1).join(' ').trim();

            return { reference, rawDescription, details };
        }

        const rawDescription = isNotEmptyArray(state.continuationLines) ? state.continuationLines[0] : state.reference;
        const details = state.continuationLines.slice(1).join(' ').trim();

        return { reference: state.reference, rawDescription, details };
    }

    private validateTransactions(transactions: ErsteRowInterface[]): void {
        for (const transaction of transactions) {
            if (!isNotEmptyString(transaction.reference) || !isNotEmptyString(transaction.description)) {
                throw this.createParseError('Erste parser produced an empty transaction reference or description');
            }

            if (!Number.isFinite(transaction.amount) || Number.isNaN(transaction.date.getTime())) {
                throw this.createParseError('Erste parser produced invalid transaction data');
            }
        }
    }

    private isNoteHeaderLine(line: string): boolean {
        return ERSTE_MODERN_NOTE_HEADER_MARKERS.some(marker => line.includes(marker));
    }

    private isPageNoiseLine(line: string): boolean {
        return ERSTE_MODERN_PAGE_NOISE_PATTERNS.some(pattern => pattern.test(line));
    }

    private isStandaloneDateLine(line: string): boolean {
        return ERSTE_MODERN_FULL_DATE_REGEX.test(line) && !ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(line);
    }

    private isGroupedBlockReferenceLine(line: string): boolean {
        return (
            /^\d{6,}(?:\s|$)/u.test(line) ||
            /^IHR KT\b/u.test(line) ||
            /^Polizze Nr\./u.test(line) ||
            /^Lastschrifteinzug\b/u.test(line) ||
            /^\S.*\d{2}\.\d{2}\.\s+\d{2}:\d{2}$/u.test(line)
        );
    }

    private isPreludeForNextStandardTransaction(line: string, nextLine: string | null): boolean {
        return (
            isNotEmptyString(nextLine) &&
            !ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(line) &&
            ERSTE_MODERN_TRANSACTION_DATE_REGEX.test(nextLine)
        );
    }

    private findNextNonEmptyLine(lines: string[], startIndex: number): string | null {
        for (let index = startIndex; index < lines.length; index += 1) {
            const trimmedLine = this.normalizeWhitespace(lines[index]);

            if (isNotEmptyString(trimmedLine)) {
                return trimmedLine;
            }
        }

        return null;
    }

    private normalizeWhitespace(line: string): string {
        return line.replace(/\s+/gu, ' ').trim();
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
            const nextLine = lines[startIndex + offset]?.trim();

            if (isNotEmptyString(nextLine) && ERSTE_MODERN_BALANCE_AMOUNT_REGEX.test(nextLine)) {
                return parseErsteAmount(nextLine, false);
            }
        }

        return null;
    }
}
