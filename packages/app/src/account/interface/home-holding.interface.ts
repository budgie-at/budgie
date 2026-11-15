import type { AccountWithSyncEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export interface HomeHoldingInterface {
    readonly instrument: InstrumentEntityInterface;
    readonly accounts: AccountWithSyncEntityInterface[];
    readonly balance: number;
    readonly value: number;
    readonly isValued: boolean;
    readonly weight: number | null;
}
