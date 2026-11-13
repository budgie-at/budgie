import type { HoldingReturnInterface } from '../../account/interface/holding-return.interface';

export interface PortfolioReturnInterface {
    readonly gain: number;
    readonly percent: number | null;
    readonly positionReturns: readonly (HoldingReturnInterface | null)[];
}
