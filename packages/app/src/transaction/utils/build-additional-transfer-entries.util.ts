import { transactionMapEntryInputToCreateEntity } from './transaction-map-entry-input-to-create-entity.util';

import type { TransactionEntryCreateEntityInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const buildAdditionalTransferEntries = (
    entries: TransactionEntryCreateInputInterface[],
    fromEntry: TransactionEntryCreateInputInterface,
    toEntry: TransactionEntryCreateInputInterface,
    transactionId: number
): TransactionEntryCreateEntityInterface[] =>
    entries
        .filter(entry => entry !== fromEntry && entry !== toEntry)
        .map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId));
