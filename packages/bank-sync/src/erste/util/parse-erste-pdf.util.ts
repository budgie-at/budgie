import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_ACCOUNT_NUMBER_REGEX, ERSTE_IBAN_REGEX } from '../constant/erste.constant';

import { parseErsteAmount } from './parse-erste-amount.util';
import { parseErsteStatementDate, parseErsteValueDate } from './parse-erste-date.util';

import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';
import type { TransactionParseStateInterface } from '../interface/transaction-parse-state.interface';

const createParseError = (message: string, originalError?: unknown): BankSyncError =>
    new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, message, BankProviderEnum.ERSTE, originalError);

const extractIban = (text: string): string => {
    const match = text.match(ERSTE_IBAN_REGEX);

    if (!match) {
        throw createParseError('Could not find IBAN in Erste PDF');
    }

    return match[0];
};

const extractAccountNumber = (text: string): string => {
    const match = text.match(ERSTE_ACCOUNT_NUMBER_REGEX);

    return match?.[1] ?? '';
};

const extractStatementDate = (text: string): Date => {
    const date = parseErsteStatementDate(text);

    if (!isDefined(date)) {
        throw createParseError('Could not find statement date in Erste PDF');
    }

    return date;
};

const extractBalance = (text: string, keyword: string): number => {
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.includes(keyword)) {
            const match = line.match(/([\d.,]+)\s*$/u);

            if (match) {
                return parseErsteAmount(match[1], false);
            }
        }
    }

    return 0;
};

const isTransactionLine = (line: string): boolean => {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
        return false;
    }

    const match = trimmed.match(/^(.+?)\s+(\d{4})\s+([\d.,]+)(-)?$/u);

    return isDefined(match);
};

const isSkippableLine = (line: string): boolean => {
    const skipPatterns = [
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

    const trimmed = line.trim();

    return skipPatterns.some(pattern => pattern.test(trimmed));
};

const isContinuationLine = (line: string): boolean => {
    const trimmed = line.trim();

    if (trimmed.length === 0 || isSkippableLine(line)) {
        return false;
    }

    return line.startsWith(' ') && !isTransactionLine(line);
};

const parseTransactionLine = (line: string): TransactionParseStateInterface | null => {
    const match = line.trim().match(/^(.+?)\s+(\d{4})\s+([\d.,]+)(-)?$/u);

    if (!match) {
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
};

const createTransaction = (state: TransactionParseStateInterface, statementDate: Date): ErsteRowInterface => {
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
};

const processLine = (
    line: string,
    currentState: TransactionParseStateInterface | null,
    transactions: ErsteRowInterface[],
    statementDate: Date
): TransactionParseStateInterface | null => {
    if (isSkippableLine(line)) {
        return currentState;
    }

    if (isTransactionLine(line)) {
        if (isDefined(currentState)) {
            transactions.push(createTransaction(currentState, statementDate));
        }

        return parseTransactionLine(line);
    }

    if (isDefined(currentState) && isContinuationLine(line)) {
        const trimmed = line.trim();

        if (isNotEmptyString(trimmed)) {
            currentState.currentContinuationLines.push(trimmed);
        }
    }

    return currentState;
};

const parseTransactions = (text: string, statementDate: Date): ErsteRowInterface[] => {
    const lines = text.split('\n');
    const transactions: ErsteRowInterface[] = [];
    let currentState: TransactionParseStateInterface | null = null;

    for (const line of lines) {
        currentState = processLine(line, currentState, transactions, statementDate);
    }

    if (isDefined(currentState)) {
        transactions.push(createTransaction(currentState, statementDate));
    }

    return transactions;
};

const extractAccountInfo = (text: string): ErsteAccountInfoInterface => {
    const iban = extractIban(text);
    const accountNumber = extractAccountNumber(text);
    const statementDate = extractStatementDate(text);
    const oldBalance = extractBalance(text, 'alter Kontostand');
    const newBalance = extractBalance(text, 'GUTHABEN') || extractBalance(text, 'neuer Kontostand');

    return {
        iban,
        accountNumber,
        currency: 'EUR',
        oldBalance,
        newBalance,
        statementDate
    };
};

export const parseErsteText = (text: string): ErsteParsedDataInterface => {
    try {
        const account = extractAccountInfo(text);
        const transactions = parseTransactions(text, account.statementDate);

        return { account, transactions };
    } catch (error) {
        if (error instanceof BankSyncError) {
            throw error;
        }

        throw createParseError('Failed to parse Erste PDF text', error);
    }
};
