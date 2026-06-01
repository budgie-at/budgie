import type { RuleTransferAccountIdsInterface } from './rule-transfer-account-ids.interface';
import type { TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface RuleTransferCandidateInterface {
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly accountIds: RuleTransferAccountIdsInterface;
}
