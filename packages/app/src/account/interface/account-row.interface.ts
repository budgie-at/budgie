import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

export interface AccountRowInterface {
    readonly left: AccountWithBankSyncEntityInterface;
    readonly right?: AccountWithBankSyncEntityInterface;
}
