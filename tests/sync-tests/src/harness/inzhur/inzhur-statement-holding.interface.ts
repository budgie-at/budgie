import type { InzhurFundLayoutInterface } from './inzhur-fund-layout.interface';

export interface InzhurStatementHoldingInterface {
    readonly layout: InzhurFundLayoutInterface;
    readonly quantity: number;
    readonly isTotalMerged?: boolean;
}
