import type { AccountEntityInterface } from '@budgie/contracts';

export interface DepositPayoutTargetInterface {
    readonly account: AccountEntityInterface;
    readonly balance: number;
    readonly firstPrincipalAt: Date;
    readonly lastBalanceEventAt: Date | null;
}
