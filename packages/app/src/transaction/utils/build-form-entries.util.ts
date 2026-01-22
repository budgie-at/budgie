import { TransactionEntryCreateEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { createTransactionEntryInput } from './create-transaction-entry-input.util';

interface BuildFormEntriesParamsInterface {
    fromAccountId: number | null;
    toAccountId: number | null;
    amount: number;
    categoryId: number;
    entries?: Array<{ categoryId: number; amount: number }> | null;
}

const buildMainEntry = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId
}: Omit<BuildFormEntriesParamsInterface, 'entries'>): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => {
    if (isDefined(fromAccountId)) {
        return createTransactionEntryInput({
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount,
            categoryId
        });
    }

    if (isDefined(toAccountId)) {
        return createTransactionEntryInput({
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount,
            categoryId
        });
    }

    return createTransactionEntryInput({
        categoryId,
        accountId: 0,
        type: TransactionEntryTypeEnum.CREDIT
    });
};

const buildEntriesFromInput = (
    entries: Array<{ categoryId: number; amount: number }>,
    fromAccountId: number | null,
    toAccountId: number | null
): Array<Omit<TransactionEntryCreateEntityInterface, 'transactionId'>> =>
    entries.map(entry =>
        createTransactionEntryInput({
            accountId: fromAccountId ?? toAccountId ?? 0,
            type: isDefined(fromAccountId) ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            amount: entry.amount,
            categoryId: entry.categoryId
        })
    );

export const buildFormEntries = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId,
    entries
}: BuildFormEntriesParamsInterface): Array<Omit<TransactionEntryCreateEntityInterface, 'transactionId'>> => {
    if (isNotEmptyArray(entries)) {
        return buildEntriesFromInput(entries, fromAccountId, toAccountId);
    }

    return [buildMainEntry({ fromAccountId, toAccountId, amount, categoryId })];
};
