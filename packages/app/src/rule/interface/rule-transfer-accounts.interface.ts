import type { AccountEntityInterface } from '@budgie/contracts';

export interface RuleTransferAccountsInterface {
    readonly fromAccount: AccountEntityInterface;
    readonly toAccount: AccountEntityInterface;
}
