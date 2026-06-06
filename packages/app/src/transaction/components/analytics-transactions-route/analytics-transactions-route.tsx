import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { StatisticsAnalyticsTransactionsPage } from '../statistics-analytics-transactions-page/statistics-analytics-transactions-page';
import { UncategorizedAnalyticsTransactionsPage } from '../uncategorized-analytics-transactions-page/uncategorized-analytics-transactions-page';

import type { AnalyticsTransactionsRouteParamsInterface } from '../../interface/analytics-transactions-route-params.interface';

interface Props {
    readonly params: AnalyticsTransactionsRouteParamsInterface;
}

export const AnalyticsTransactionsRoute = ({ params }: Props) => {
    if (params.mode === AnalyticsTransactionsModeEnum.UNCATEGORIZED) {
        return <UncategorizedAnalyticsTransactionsPage {...params} />;
    }

    return <StatisticsAnalyticsTransactionsPage {...params} />;
};
