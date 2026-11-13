import type { YieldPositionSectionEnum } from '../enum/yield-position-section.enum';
import type { YieldAnnualYieldInterface } from './yield-annual-yield.interface';
import type { YieldVsRateInterface } from './yield-vs-rate.interface';
import type { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';

export interface YieldPositionSummaryInterface {
    readonly accountId: number;
    readonly title: string;
    readonly accountType: AccountTypeEnum;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly section: YieldPositionSectionEnum;
    readonly earned: number;
    readonly isEarnedEstimated: boolean;
    readonly rewardUnits: number;
    readonly tax: number;
    readonly annualYield: YieldAnnualYieldInterface;
    readonly accruing: number | null;
    readonly interestRate: number | null;
    readonly deadline: string | null;
    readonly vsRate: YieldVsRateInterface | null;
}
