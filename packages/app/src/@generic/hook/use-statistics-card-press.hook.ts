import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { AnalyticsTransactionsModeEnum } from '../../transaction/enum/analytics-transactions-mode.enum';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';

export const useStatisticsCardPress = (
    filters: TransactionFilterInterface,
    isIncome: boolean,
    inboxMode: AnalyticsTransactionsModeEnum
) => {
    const router = useRouter();

    return (entityParams: Record<string, string> | null) => {
        const type = isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;
        const params = entityParams
            ? {
                  type,
                  ...entityParams,
                  ...(filters.date?.from && { startDate: filters.date.from.toISOString() }),
                  ...(filters.date?.to && { endDate: filters.date.to.toISOString() })
              }
            : buildUncategorizedRouteParams({ ...filters, types: [type] }, inboxMode);

        router.push({ pathname: '/analytics/transactions', params });
    };
};
