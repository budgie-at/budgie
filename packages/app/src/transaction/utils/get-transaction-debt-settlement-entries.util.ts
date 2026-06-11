import { TransactionEntryKindEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const getTransactionDebtSettlementEntries = <TEntry extends Partial<Pick<TransactionEntryCreateInputInterface, 'kind'>>>(
    entries: readonly TEntry[]
): TEntry[] => entries.filter(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);
