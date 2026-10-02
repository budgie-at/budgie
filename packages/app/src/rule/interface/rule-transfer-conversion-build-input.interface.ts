import type { RuleTransferAccountIdsInterface } from './rule-transfer-account-ids.interface';
import type { RuleTransferConvertedAmountInterface } from './rule-transfer-converted-amount.interface';
import type { TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface RuleTransferConversionBuildInputInterface {
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly accountIds: RuleTransferAccountIdsInterface;
    readonly converted: RuleTransferConvertedAmountInterface;
}
