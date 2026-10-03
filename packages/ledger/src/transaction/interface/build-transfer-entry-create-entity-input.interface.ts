import type { TransactionEntryTypeEnum } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export interface BuildTransferEntryCreateEntityInputInterface {
    readonly transactionId: number;
    readonly accountId: number;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly valuation: EntryBaseValuationInterface;
}
