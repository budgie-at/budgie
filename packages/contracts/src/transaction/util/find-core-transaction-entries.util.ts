import { TransactionEntryCreateEntityInterface } from '../../transaction-entry/entity/transaction-entry-create-entity.interface';

export const findCoreTransactionEntries = (
    entries: Omit<TransactionEntryCreateEntityInterface, 'transactionId'>[],
    fromAccountId: number | null,
    toAccountId: number | null
) => {
    const fromEntryIndex = entries.findIndex(({ accountId }) => accountId === fromAccountId);
    const toEntryIndex = entries.findIndex(({ accountId }) => accountId === toAccountId);

    return {
        fromEntryIndex,
        toEntryIndex,
        fromEntry: fromEntryIndex >= 0 ? entries[fromEntryIndex] : null,
        toEntry: toEntryIndex >= 0 ? entries[toEntryIndex] : null
    };
};
