import { ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

const resolveType = (creditEntry: unknown, debitEntry: unknown) => {
    if (!isDefined(creditEntry)) {
        return TransactionTypeEnum.INCOME;
    }

    return isDefined(debitEntry) ? TransactionTypeEnum.TRANSFER : TransactionTypeEnum.EXPENSE;
};

export const buildInzhurTransactionInput = (
    title: string,
    externalId: string,
    operatedAt: Date,
    entries: readonly TransactionEntryCreateInputInterface[]
): TransactionCreateInputInterface => {
    const creditEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
    const debitEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

    return {
        amount: (creditEntry ?? debitEntry)?.amount ?? 0,
        title,
        comment: '',
        type: resolveType(creditEntry, debitEntry),
        exchangeRate: 1,
        operatedAt,
        externalId,
        updatedBy: null,
        externalSource: ExternalSourceEnum.INZHUR,
        fromAccountId: creditEntry?.accountId ?? null,
        toAccountId: debitEntry?.accountId ?? null,
        tagIds: [],
        entries: [...entries]
    };
};
