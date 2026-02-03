import { generateLocalId } from './generate-local-id.util';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export interface EntryWithLocalIdInterface extends TransactionEntryCreateInputInterface {
    readonly localId: string;
}

export const addLocalId = (entry: TransactionEntryCreateInputInterface): EntryWithLocalIdInterface => ({
    ...entry,
    localId: generateLocalId()
});

export const createEmptyEntry = (entryType: TransactionEntryTypeEnum, accountId: number, initialAmount = 0): EntryWithLocalIdInterface => ({
    accountId,
    categoryId: 0,
    amount: initialAmount,
    type: entryType,
    mccCategoryId: null,
    externalId: null,
    localId: generateLocalId()
});

export const stripLocalId = (entry: EntryWithLocalIdInterface): TransactionEntryCreateInputInterface => ({
    accountId: entry.accountId,
    categoryId: entry.categoryId,
    amount: entry.amount,
    type: entry.type,
    mccCategoryId: entry.mccCategoryId,
    externalId: entry.externalId
});

export const entryKeyExtractor = (item: EntryWithLocalIdInterface): string => item.localId;
