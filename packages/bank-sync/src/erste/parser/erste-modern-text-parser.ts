import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_MODERN_END_MARKER, ERSTE_MODERN_FORMAT_MARKER, ERSTE_MODERN_TRANSACTION_DATE_REGEX } from '../constant/erste.constant';
import { parseErsteAmount } from '../util/parse-erste-amount.util';

import { ErsteBaseTextParser } from './erste-base-text-parser';

import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

const BALANCE_SEARCH_LINES_LIMIT = 3;
const BALANCE_AMOUNT_REGEX = /^[\d.,]+$/u;
const SAME_LINE_BALANCE_REGEX = /([\d.,]+)\s*$/u;

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

            if (!isInSection && trimmed.includes(ERSTE_MODERN_FORMAT_MARKER)) {
                isInSection = true;
            } else if (isInSection && trimmed.includes(ERSTE_MODERN_END_MARKER)) {
                break;
            } else if (isInSection) {
                sectionLines.push(trimmed);
            }
        }

        return sectionLines;
    }

    private buildTransactionsFromLines(lines: string[]): ErsteRowInterface[] {
        const transactions: ErsteRowInterface[] = [];
        let descriptionLines: string[] = [];

        for (const line of lines) {
            const transactionMatch = line.match(ERSTE_MODERN_TRANSACTION_DATE_REGEX);

            if (isDefined(transactionMatch)) {
                const transaction = this.createTransaction(transactionMatch, descriptionLines);

                if (isDefined(transaction)) {
                    transactions.push(transaction);
                }

                descriptionLines = [];
            } else if (isNotEmptyString(line)) {
                descriptionLines.push(line);
            }
        }

        return transactions;
    }

    private createTransaction(match: RegExpMatchArray, descriptionLines: string[]): ErsteRowInterface | null {
        const [, day, month, year, amount, debitMarker] = match;

        if (!isNotEmptyString(day) || !isNotEmptyString(month) || !isNotEmptyString(year) || !isNotEmptyString(amount)) {
            return null;
        }

        const isDebit = debitMarker === '-';
        const parsedAmount = parseErsteAmount(amount, isDebit);
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0);
        const reference = isNotEmptyArray(descriptionLines) ? descriptionLines[0] : '';
        const description = descriptionLines.length > 1 ? descriptionLines[1] : reference;
        const details = descriptionLines.slice(2).join(' ').trim();

        return {
            date,
            reference,
            description,
            details,
            amount: parsedAmount,
            isCredit: !isDebit
        };
    }

    private parseBalanceFromLine(line: string, keyword: string, lines: string[], lineIndex: number): number | null {
        const sameLineMatch = line.match(SAME_LINE_BALANCE_REGEX);
        const keywordEndIndex = line.indexOf(keyword) + keyword.length;
        const afterKeyword = line.slice(keywordEndIndex).trim();

        if (isDefined(sameLineMatch) && isNotEmptyString(afterKeyword)) {
            return parseErsteAmount(sameLineMatch[1], false);
        }

        return this.findBalanceInNextLines(lines, lineIndex);
    }

    private findBalanceInNextLines(lines: string[], startIndex: number): number | null {
        for (let offset = 1; offset <= BALANCE_SEARCH_LINES_LIMIT; offset += 1) {
            const nextLineIndex = startIndex + offset;

            if (nextLineIndex >= lines.length) {
                break;
            }

            const nextLine = lines[nextLineIndex].trim();

            if (BALANCE_AMOUNT_REGEX.test(nextLine)) {
                return parseErsteAmount(nextLine, false);
            }
        }

        return null;
    }
}
