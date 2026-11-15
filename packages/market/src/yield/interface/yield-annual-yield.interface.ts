import type { YieldUnavailableReasonEnum } from '../enum/yield-unavailable-reason.enum';

export interface YieldAnnualYieldInterface {
    readonly rate: number | null;
    readonly reason: YieldUnavailableReasonEnum | null;
    readonly isEstimated: boolean;
}
