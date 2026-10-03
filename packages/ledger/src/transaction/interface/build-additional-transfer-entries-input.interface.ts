import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export interface BuildAdditionalTransferEntriesInputInterface {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly fromEntry: TransactionEntryCreateInputInterface;
    readonly toEntry: TransactionEntryCreateInputInterface;
    readonly transactionId: number;
    readonly valuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
}
