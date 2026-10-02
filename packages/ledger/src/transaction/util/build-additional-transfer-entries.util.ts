import { transactionMapEntryInputToCreateEntity } from './transaction-map-entry-input-to-create-entity.util';

import type { BuildAdditionalTransferEntriesInputInterface } from '../interface/build-additional-transfer-entries-input.interface';
import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const buildAdditionalTransferEntries = ({
    entries,
    fromEntry,
    toEntry,
    transactionId,
    valuations
}: BuildAdditionalTransferEntriesInputInterface): TransactionEntryCreateEntityInterface[] =>
    entries
        .filter(entry => entry !== fromEntry && entry !== toEntry)
        .map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId, valuations.get(entry)));
