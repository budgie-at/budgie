import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export interface ValuedTransferEntryInterface {
    readonly entry: TransactionEntryCreateInputInterface;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly valuation: EntryBaseValuationInterface;
}
