import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryTypeEnum } from '@budgie/contracts';

export interface BuildTransferEntryCreateEntityInputInterface {
    readonly transactionId: number;
    readonly accountId: number;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly valuation: EntryBaseValuationInterface;
}
