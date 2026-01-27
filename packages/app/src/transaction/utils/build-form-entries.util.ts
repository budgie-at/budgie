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

type TransactionEntryFormInterface = Omit<TransactionEntryCreateEntityInterface, 'transactionId'>;

const buildMainEntry = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId
}: Omit<BuildFormEntriesParamsInterface, 'entries'>): TransactionEntryFormInterface => {
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
): TransactionEntryFormInterface[] =>
    entries.map(entry =>
        createTransactionEntryInput({
            accountId: fromAccountId ?? toAccountId ?? 0,
            type: isDefined(fromAccountId) ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            amount: entry.amount,
            categoryId: entry.categoryId
        })
    );

const buildTransferEntries = (
    fromAccountId: number,
    toAccountId: number,
    amount: number,
    categoryId: number
): TransactionEntryFormInterface[] => [
    createTransactionEntryInput({
        accountId: fromAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId
    }),
    createTransactionEntryInput({
        accountId: toAccountId,
        type: TransactionEntryTypeEnum.DEBIT,
        amount,
        categoryId
    })
];

export const buildFormEntries = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId,
    entries
}: BuildFormEntriesParamsInterface): TransactionEntryFormInterface[] => {
    if (isNotEmptyArray(entries)) {
        return buildEntriesFromInput(entries, fromAccountId, toAccountId);
    }

    if (isDefined(fromAccountId) && isDefined(toAccountId)) {
        return buildTransferEntries(fromAccountId, toAccountId, amount, categoryId);
    }

    return [buildMainEntry({ fromAccountId, toAccountId, amount, categoryId })];
};
