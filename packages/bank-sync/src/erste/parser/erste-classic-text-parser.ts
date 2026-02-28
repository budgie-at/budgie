import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankSyncError } from '../../core/error/bank-sync.error';
import { parseErsteAmount } from '../util/parse-erste-amount.util';
import { parseErsteValueDate } from '../util/parse-erste-value-date.util';

import { ErsteBaseTextParser } from './erste-base-text-parser';

import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';
import type { TransactionParseStateInterface } from '../interface/transaction-parse-state.interface';

export class ErsteClassicTextParser extends ErsteBaseTextParser {
    private readonly skipPatterns: RegExp[] = [
        /^BLZ\s+\d+/u,
        /^BIC\s+/u,
        /^EUR$/u,
        /^Herr\/Frau\/Firma/u,
        /^Zuletzt gültiger/u,
        /^last valid/u,
        /^\d{3}\/\d{3}\s+\d{2}\.\d{2}\.\d{4}/u,
        /^Auszug\/Blatt/u,
        /^Belege\/Vouchers/u,
        /^Datum\/Uhrzeit/u,
        /^Kontonummer/u,
        /^Account Statement/u,
        /^alter Kontostand/u,
        /^Old Balance/u,
        /^Wert\/Value/u,
        /^Beträge\/Amounts/u,
        /^Gutschriften\/Credits/u,
        /^Belastungen\/Debits/u,
        /^neuer Kontostand/u,
        /^New Balance/u,
        /^GUTHABEN/u,
        /^KONTOAUSZUG/u,
        /^ERSTE\s/u,
        /^\*\*\*/u,
        /^Guthaben auf Girokonten/u,
        /^sind gemäß/u,
        /^Anlegerentschädigungsgesetz/u,
        /^Nähere Informationen/u,
        /^'Informationsbogen/u,
        /^jeder Filiale/u,
        /^www\.erstebank/u,
        /^www\.sparkasse/u,
        /^\*Information gemäß/u,
        /^Sollzinsen:/u,
        /^Eine Änderung/u,
        /^den in den Allgemeinen/u,
        /^Änderungsklauseln/u,
        /^Reklamationen bitte/u
    ];

    parse(text: string): ErsteParsedDataInterface {
        try {
            const account = this.extractAccountInfo(text, 'alter Kontostand', ['GUTHABEN', 'neuer Kontostand']);
            const transactions = this.parseTransactions(text, account.statementDate);

            return { account, transactions };
        } catch (error) {
            if (error instanceof BankSyncError) {
                throw error;
            }

            throw this.createParseError('Failed to parse Erste classic PDF text', error);
        }
    }

    protected extractBalance(text: string, keyword: string): number {
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.includes(keyword)) {
                const match = line.match(/([\d.,]+)\s*$/u);

                if (isDefined(match)) {
                    return parseErsteAmount(match[1], false);
                }
            }
        }

        return 0;
    }

    private isTransactionLine(line: string): boolean {
        const trimmed = line.trim();

        if (trimmed.length === 0) {
            return false;
        }

        const match = trimmed.match(/^(.+?)\s+(\d{4})\s+([\d.,]+)(-)?$/u);

        return isDefined(match);
    }

    private isSkippableLine(line: string): boolean {
        const trimmed = line.trim();

        return this.skipPatterns.some(pattern => pattern.test(trimmed));
    }

    private isContinuationLine(line: string): boolean {
        const trimmed = line.trim();

        if (trimmed.length === 0 || this.isSkippableLine(line)) {
            return false;
        }

        return !this.isTransactionLine(line);
    }

    private parseTransactionLine(line: string): TransactionParseStateInterface | null {
        const match = line.trim().match(/^(.+?)\s+(\d{4})\s+([\d.,]+)(-)?$/u);

        if (!isDefined(match)) {
            return null;
        }

        const [, reference, dateCode, amount, debitMarker] = match;

        return {
            currentReference: reference.trim(),
            currentContinuationLines: [],
            currentDate: dateCode,
            currentAmount: amount,
            currentIsDebit: debitMarker === '-'
        };
    }

    private createTransaction(state: TransactionParseStateInterface, statementDate: Date): ErsteRowInterface {
        const amount = parseErsteAmount(state.currentAmount, state.currentIsDebit);
        const description = isNotEmptyArray(state.currentContinuationLines) ? state.currentContinuationLines[0] : state.currentReference;
        const details = state.currentContinuationLines.slice(1).join(' ').trim();

        return {
            date: parseErsteValueDate(state.currentDate, statementDate),
            reference: state.currentReference,
            description,
            details,
            amount,
            isCredit: !state.currentIsDebit
        };
    }

    private processLine(
        line: string,
        currentState: TransactionParseStateInterface | null,
        transactions: ErsteRowInterface[],
        statementDate: Date
    ): TransactionParseStateInterface | null {
        if (this.isSkippableLine(line)) {
            return currentState;
        }

        if (this.isTransactionLine(line)) {
            if (isDefined(currentState)) {
                transactions.push(this.createTransaction(currentState, statementDate));
            }

            return this.parseTransactionLine(line);
        }

        if (isDefined(currentState) && this.isContinuationLine(line)) {
            const trimmed = line.trim();

            if (isNotEmptyString(trimmed)) {
                currentState.currentContinuationLines.push(trimmed);
            }
        }

        return currentState;
    }

    private parseTransactions(text: string, statementDate: Date): ErsteRowInterface[] {
        const lines = text.split('\n');
        const transactions: ErsteRowInterface[] = [];
        let currentState: TransactionParseStateInterface | null = null;

        for (const line of lines) {
            currentState = this.processLine(line, currentState, transactions, statementDate);
        }

        if (isDefined(currentState)) {
            transactions.push(this.createTransaction(currentState, statementDate));
        }

        return transactions;
    }
}
