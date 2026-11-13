import type { PortfolioReturnInterface } from '../../brokerage/interface/portfolio-return.interface';
import type { HoldingReturnInterface } from './holding-return.interface';
import type { AccountTypeEnum } from '@budgie/contracts';

export interface HomeHoldingReturnsInterface {
    readonly holdingsBySectionType: ReadonlyMap<AccountTypeEnum, ReadonlyMap<number, HoldingReturnInterface>>;
    readonly bySectionType: ReadonlyMap<AccountTypeEnum, Pick<PortfolioReturnInterface, 'gain' | 'percent'>>;
    readonly todayByInstrumentId: ReadonlyMap<number, number>;
    readonly todayBySectionType: ReadonlyMap<AccountTypeEnum, Pick<PortfolioReturnInterface, 'gain' | 'percent'>>;
    readonly isLoading: boolean;
}
