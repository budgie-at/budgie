import { AccountWithSyncEntityInterface } from '@budgie/contracts';

export interface AccountRowInterface {
    readonly left: AccountWithSyncEntityInterface;
    readonly right?: AccountWithSyncEntityInterface;
}
