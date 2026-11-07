import type { LedgerMovementInterface } from '@budgie/contracts';

export interface InzhurDatedMovementInterface {
    readonly movement: LedgerMovementInterface;
    readonly day: string;
    readonly amount: number;
}
