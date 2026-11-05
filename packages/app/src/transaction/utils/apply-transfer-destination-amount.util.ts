import { TransactionEntryTypeEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const applyTransferDestinationAmount = (
    entries: TransactionEntryCreateInputInterface[],
    destinationAmount: number
): TransactionEntryCreateInputInterface[] =>
    entries.map(entry => (entry.type === TransactionEntryTypeEnum.DEBIT ? { ...entry, amount: destinationAmount } : entry));
