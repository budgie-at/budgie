import { isPrivatbankSameOriginalAmount } from '../../shared/utils/is-privatbank-same-original-amount.util';

import type { ExternalSourceEnum, TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export const isPrivatbankClosedByAbsorbedRefunds = (
    absorbedEntries: readonly TransactionEntryEntityInterface[],
    absorbedSourcesById: ReadonlyMap<number, Pick<TransactionEntityInterface, 'externalSource'>>,
    expenseSource: ExternalSourceEnum | null,
    expenseCreditEntry: Pick<TransactionEntryEntityInterface, 'amount' | 'exchangeRate' | 'operationInstrumentId'>
): boolean =>
    absorbedEntries.some(entry =>
        isPrivatbankSameOriginalAmount(
            absorbedSourcesById.get(entry.originalTransactionId ?? 0)?.externalSource ?? null,
            entry,
            expenseSource,
            expenseCreditEntry
        )
    );
