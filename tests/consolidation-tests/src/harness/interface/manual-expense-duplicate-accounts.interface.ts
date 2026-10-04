import type { AccountEntityInterface } from '@budgie/contracts';

export interface ManualExpenseDuplicateAccountsInterface {
    readonly syncedAccount: AccountEntityInterface;
    readonly manualAccount: AccountEntityInterface;
}
