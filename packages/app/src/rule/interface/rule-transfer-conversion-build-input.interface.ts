import type { RuleTransferAccountIdsInterface } from './rule-transfer-account-ids.interface';
import type { RuleTransferAccountsInterface } from './rule-transfer-accounts.interface';
import type { RuleTransferConvertedAmountInterface } from './rule-transfer-converted-amount.interface';
import type { TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface RuleTransferConversionBuildInputInterface {
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly accountIds: RuleTransferAccountIdsInterface;
    readonly accounts: RuleTransferAccountsInterface;
    readonly converted: RuleTransferConvertedAmountInterface;
}
