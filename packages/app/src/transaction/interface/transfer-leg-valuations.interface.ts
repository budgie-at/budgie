import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface TransferLegValuationsInterface {
    readonly additionalEntryValuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
    readonly fromValuation: EntryBaseValuationInterface;
    readonly toValuation: EntryBaseValuationInterface;
}
