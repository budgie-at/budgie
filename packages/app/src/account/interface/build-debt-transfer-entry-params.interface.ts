import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryTypeEnum } from '@budgie/contracts';

export interface BuildDebtTransferEntryParamsInterface {
    readonly transactionId: number;
    readonly accountId: number;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly valuation: EntryBaseValuationInterface;
}
