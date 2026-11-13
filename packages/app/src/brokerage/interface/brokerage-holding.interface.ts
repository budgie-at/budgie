import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export interface BrokerageHoldingInterface {
    readonly account: AccountWithSyncEntityInterface;
    readonly label: string;
    readonly value: number;
    readonly isValued: boolean;
    readonly weight: number | null;
    readonly gain: number | null;
    readonly gainPercent: number | null;
}
