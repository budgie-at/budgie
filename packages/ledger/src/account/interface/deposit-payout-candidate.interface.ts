import type { AccountEntityInterface, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface DepositPayoutCandidateInterface {
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly entry: TransactionEntryEntityInterface;
    readonly account: AccountEntityInterface;
}
