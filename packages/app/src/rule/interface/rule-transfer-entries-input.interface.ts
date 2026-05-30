import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryEntityInterface } from '@budgie/contracts';

export interface RuleTransferEntriesInputInterface {
    readonly transactionId: number;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly convertedAmount: number;
    readonly creditValuation: EntryBaseValuationInterface;
    readonly debitValuation: EntryBaseValuationInterface;
}
