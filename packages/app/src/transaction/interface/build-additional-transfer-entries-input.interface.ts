import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface BuildAdditionalTransferEntriesInputInterface {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly fromEntry: TransactionEntryCreateInputInterface;
    readonly toEntry: TransactionEntryCreateInputInterface;
    readonly transactionId: number;
    readonly valuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
}
