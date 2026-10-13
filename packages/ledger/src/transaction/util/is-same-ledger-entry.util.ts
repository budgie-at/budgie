import { TransactionEntryKindEnum, convertToMicroUnits } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export const isSameLedgerEntry = (
    existingEntry: Pick<TransactionEntryEntityInterface, 'accountId' | 'amount' | 'type' | 'kind'>,
    input: Pick<TransactionEntryCreateInputInterface, 'accountId' | 'amount' | 'type' | 'kind'>
): boolean =>
    existingEntry.accountId === input.accountId &&
    existingEntry.amount === convertToMicroUnits(input.amount) &&
    existingEntry.type === input.type &&
    existingEntry.kind === (input.kind ?? TransactionEntryKindEnum.PRIMARY);
