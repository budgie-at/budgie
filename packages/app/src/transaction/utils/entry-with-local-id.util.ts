import { TransactionEntryKindEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export interface EntryWithLocalIdInterface extends TransactionEntryCreateInputInterface {
    readonly localId: string;
}

const generateLocalId = (): string => `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const addLocalId = (entry: TransactionEntryCreateInputInterface): EntryWithLocalIdInterface => ({
    ...entry,
    localId: generateLocalId()
});

export const createEmptyEntry = (entryType: TransactionEntryTypeEnum, accountId: number, initialAmount = 0): EntryWithLocalIdInterface => ({
    accountId,
    categoryId: 0,
    amount: initialAmount,
    type: entryType,
    kind: TransactionEntryKindEnum.PRIMARY,
    mccCategoryId: null,
    externalId: null,
    localId: generateLocalId()
});

export const withEntryAmount = <TEntry extends TransactionEntryCreateInputInterface>(entry: TEntry, amount: number): TEntry =>
    entry.amount === amount
        ? entry
        : {
              ...entry,
              amount,
              baseInstrumentId: null,
              baseExchangeRate: null,
              baseAmount: null,
              quotedInstrumentId: null,
              quotedAmount: null,
              quotedUnitPrice: null
          };

export const stripLocalId = ({ localId: _localId, ...entry }: EntryWithLocalIdInterface): TransactionEntryCreateInputInterface => entry;

export const entryKeyExtractor = (item: EntryWithLocalIdInterface): string => item.localId;
