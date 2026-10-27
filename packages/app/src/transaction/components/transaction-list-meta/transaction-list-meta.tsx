import { TransactionFilterInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';
import { useGetUncategorizedTransactionCountQuery } from '../../query/use-get-uncategorized-transaction-count.query';
import { buildUncategorizedRouteParams } from '../../utils/build-uncategorized-route-params.util';
import { UncategorizedTransactionsPill } from '../uncategorized-transactions-pill/uncategorized-transactions-pill';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const TransactionListMeta = ({ filters }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { count: uncategorizedTransactionCount } = useGetUncategorizedTransactionCountQuery(filters);
    const { count: transactionCount } = useGetTransactionCountQuery(filters);

    const canShowUncategorizedPill = !isDefined(filters.categoryIds) && isPositiveNumber(uncategorizedTransactionCount);
    const canShowTransactionCount = isPositiveNumber(transactionCount);
    const transactionCountText = t({ message: plural(transactionCount, { one: '# transaction', other: '# transactions' }) });

    const handleUncategorizedPress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.CATEGORIZE)
        });
    };

    if (!canShowUncategorizedPill && !canShowTransactionCount) {
        return null;
    }

    return (
        <View className="pt-2 pb-1 flex-row items-center gap-x-md">
            {canShowUncategorizedPill ? (
                <UncategorizedTransactionsPill count={uncategorizedTransactionCount} onPress={handleUncategorizedPress} />
            ) : null}
            {canShowTransactionCount ? (
                <Text className="ml-auto text-sm text-secondary-foreground" numberOfLines={1}>
                    {transactionCountText}
                </Text>
            ) : null}
        </View>
    );
};
