import type { TransactionEntryCreateInputInterface, TransactionEntryEntityInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export interface ImportedEntryUpdateContextInterface {
    readonly existingEntries: Map<string, TransactionEntryEntityInterface>;
    readonly valuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
}
