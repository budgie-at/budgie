import { TransactionFilterInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { useGetUncategorizedTransactionCountQuery } from '../../query/use-get-uncategorized-transaction-count.query';
import { buildUncategorizedRouteParams } from '../../utils/build-uncategorized-route-params.util';
import { UncategorizedTransactionsPill } from '../uncategorized-transactions-pill/uncategorized-transactions-pill';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const TransactionListUncategorizedPill = ({ filters }: Props) => {
    const router = useRouter();
    const { count } = useGetUncategorizedTransactionCountQuery(filters);

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.CATEGORIZE)
        });
    };

    if (isDefined(filters.categoryIds) || !isPositiveNumber(count)) {
        return null;
    }

    return <UncategorizedTransactionsPill count={count} onPress={handlePress} />;
};
