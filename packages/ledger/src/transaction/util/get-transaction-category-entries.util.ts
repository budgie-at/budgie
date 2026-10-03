import { TransactionEntryTypeEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const getTransactionCategoryEntries = <TEntry extends Pick<TransactionEntryCreateInputInterface, 'type'>>(
    entries: readonly TEntry[]
): TEntry[] => entries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE);
