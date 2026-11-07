import { TransactionEntryTypeEnum } from '@budgie/contracts';

import type { TransactionEntryEntityInterface } from '@budgie/contracts';

export const sumSignedAccountEntries = (
    entries: readonly Pick<TransactionEntryEntityInterface, 'accountId' | 'type' | 'amount'>[],
    accountId: number
): number =>
    entries
        .filter(entry => entry.accountId === accountId)
        .reduce((sum, entry) => sum + (entry.type === TransactionEntryTypeEnum.DEBIT ? entry.amount : -entry.amount), 0);
