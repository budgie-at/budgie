import type { TransactionEntryEntityInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

export interface RuleTransferEntriesInputInterface {
    readonly transactionId: number;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly convertedAmount: number;
    readonly creditValuation: EntryBaseValuationInterface;
    readonly debitValuation: EntryBaseValuationInterface;
}
