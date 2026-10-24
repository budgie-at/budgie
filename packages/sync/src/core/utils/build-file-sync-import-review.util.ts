import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../enum/sync-account-balance-state.enum';
import { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';

import type { FileBankSyncImportReviewInterface } from '../interface/file-bank-sync-import-review.interface';
import type { FileBankSyncReviewTransactionInterface } from '../interface/file-bank-sync-review-transaction.interface';
import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';

const toReviewTransaction = (transaction: SyncTransactionInterface, currencyCode: string): FileBankSyncReviewTransactionInterface => ({
    externalId: transaction.id,
    operatedAt: new Date(transaction.time * 1000),
    description: transaction.description,
    signedAmount: transaction.type === SyncTransactionTypeEnum.INCOME ? Math.abs(transaction.amount) : -Math.abs(transaction.amount),
    currencyCode
});

const isKnownTransaction = (transaction: SyncTransactionInterface, existingTransactionIdMap: Map<string, number>) =>
    existingTransactionIdMap.has(transaction.id) ||
    (transaction.legacyExternalIds ?? []).some(legacyExternalId => existingTransactionIdMap.has(legacyExternalId));

const resolveClosingBalance = (bankAccount: SyncAccountInterface, transactions: SyncTransactionInterface[]): number | null => {
    if (bankAccount.balanceState !== SyncAccountBalanceStateEnum.REPRESENTABLE) {
        return null;
    }

    if (bankAccount.balance !== 0) {
        return bankAccount.balance;
    }

    const latestTransaction = transactions.reduce<SyncTransactionInterface | null>(
        (latest, transaction) => (!isDefined(latest) || transaction.time > latest.time ? transaction : latest),
        null
    );

    return isDefined(latestTransaction) && latestTransaction.balance !== 0 ? latestTransaction.balance : null;
};

export const buildFileSyncImportReview = (
    client: FileBasedSyncClientInterface,
    bankAccounts: SyncAccountInterface[],
    existingTransactionIdMap: Map<string, number>
): FileBankSyncImportReviewInterface => {
    const accountTransactions = bankAccounts.flatMap(bankAccount =>
        client.getTransactions(bankAccount.id).map(transaction => ({ transaction, currencyCode: bankAccount.currencyCode }))
    );
    const operatedTimes = accountTransactions.map(({ transaction }) => transaction.time);
    const sortedByRecency = [...accountTransactions].sort((left, right) => right.transaction.time - left.transaction.time);

    return {
        parsedTransactionCount: accountTransactions.length,
        duplicateTransactionCount: accountTransactions.filter(({ transaction }) =>
            isKnownTransaction(transaction, existingTransactionIdMap)
        ).length,
        earliestOperatedAt: isNotEmptyArray(operatedTimes) ? new Date(Math.min(...operatedTimes) * 1000) : null,
        latestOperatedAt: isNotEmptyArray(operatedTimes) ? new Date(Math.max(...operatedTimes) * 1000) : null,
        sampleTransactions: sortedByRecency
            .slice(0, 3)
            .map(({ transaction, currencyCode }) => toReviewTransaction(transaction, currencyCode)),
        accounts: bankAccounts.map(bankAccount => ({
            externalId: bankAccount.id,
            title: bankAccount.title ?? bankAccount.iban ?? bankAccount.id,
            currencyCode: bankAccount.currencyCode,
            closingBalance: resolveClosingBalance(bankAccount, client.getTransactions(bankAccount.id))
        }))
    };
};
