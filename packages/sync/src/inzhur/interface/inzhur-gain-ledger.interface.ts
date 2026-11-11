import type { InzhurDatedMovementInterface } from './inzhur-dated-movement.interface';
import type { InzhurValuePointInterface } from './inzhur-value-point.interface';

export interface InzhurGainLedgerInterface {
    readonly cashAccountId: number;
    readonly fundAccountIds: readonly number[];
    readonly firstDay: string;
    readonly dated: readonly InzhurDatedMovementInterface[];
    readonly pricesByAccountId: ReadonlyMap<number, readonly InzhurValuePointInterface[]>;
    readonly balanceOn: (accountId: number, day: string) => number;
    readonly priceOn: (accountId: number, day: string) => number | null;
}
