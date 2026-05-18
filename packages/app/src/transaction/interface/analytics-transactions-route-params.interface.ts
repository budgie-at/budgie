import type { AnalyticsTransactionsModeEnum } from '../enum/analytics-transactions-mode.enum';
import type { TransactionTypeEnum } from '@budgie/contracts';

export interface AnalyticsTransactionsRouteParamsInterface {
    readonly mode?: AnalyticsTransactionsModeEnum;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly categoryId?: string;
    readonly tagId?: string;
    readonly type?: TransactionTypeEnum;
    readonly types?: TransactionTypeEnum[];
    readonly accountIds?: number[];
    readonly tagIds?: number[];
}
