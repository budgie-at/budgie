import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { DB, TransactionEntryCreateInputInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export interface ImportedEntryUpdateContextInterface {
    readonly existingEntries: Map<string, TransactionEntryEntityInterface>;
    readonly valuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
    readonly tx: DB;
}
