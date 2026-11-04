import type { InzhurHoldingInterface } from './inzhur-holding.interface';

export interface InzhurStatementInterface {
    readonly statementDate: string;
    readonly holdings: readonly InzhurHoldingInterface[];
}
