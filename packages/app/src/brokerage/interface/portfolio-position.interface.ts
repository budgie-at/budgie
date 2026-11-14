import type { InstrumentPositionInterface } from '@budgie/market';

export interface PortfolioPositionInterface {
    readonly value: number;
    readonly balance: number;
    readonly isValued: boolean;
    readonly position: InstrumentPositionInterface | null;
}
