import { TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const getTransactionCategoryEntries = <
    TEntry extends Pick<TransactionEntryCreateInputInterface, 'type'> & Partial<Pick<TransactionEntryCreateInputInterface, 'kind'>>
>(
    entries: readonly TEntry[]
): TEntry[] =>
    entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE && entry.kind !== TransactionEntryKindEnum.DEBT_SETTLEMENT);
