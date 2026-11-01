import type { StatisticsNettedRefundInterface } from './statistics-netted-refund.interface';
import type { StatisticsTrendPointInterface } from './statistics-trend-point.interface';

export interface StatisticsDrillDownSummaryInterface {
    readonly amount: number;
    readonly transactionCount: number;
    readonly base: number;
    readonly trend: readonly StatisticsTrendPointInterface[];
    readonly nettedRefund: StatisticsNettedRefundInterface | null;
}
