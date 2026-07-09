import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { AnalyticsTransactionsModeEnum } from '../../enum/analytics-transactions-mode.enum';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { useGetUncategorizedTransactionCountQuery } from '../../query/use-get-uncategorized-transaction-count.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';
import { UncategorizedTransactionsPill } from '../uncategorized-transactions-pill/uncategorized-transactions-pill';

interface Props {
    readonly accountId?: number | null;
    readonly filters?: TransactionFilterInterface;
    readonly showFilters?: boolean;
    readonly footerSpacerMultiplier?: number;
}

const useTransactionListFilters = (accountId: number | null, externalFilters: TransactionFilterInterface | undefined) => {
    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);
    const baseAccountIds = isDefined(accountId) ? [accountId] : null;
    const activeFilters = externalFilters ?? { ...internalFilters, accountIds: baseAccountIds ?? internalFilters.accountIds };

    return { activeFilters, setInternalFilters };
};

const buildNullableArrayParam = (values: readonly (number | string)[] | null): string | null => {
    if (isNotEmptyArray(values)) {
        return values.join(',');
    }

    return null;
};

const buildUncategorizedRouteParams = (activeFilters: TransactionFilterInterface) => {
    const types = buildNullableArrayParam(activeFilters.types);
    const accountIds = buildNullableArrayParam(activeFilters.accountIds);
    const tagIds = buildNullableArrayParam(activeFilters.tagIds);
    const startDate = activeFilters.date?.from?.toISOString() ?? null;
    const endDate = activeFilters.date?.to?.toISOString() ?? null;

    return {
        mode: AnalyticsTransactionsModeEnum.UNCATEGORIZED,
        ...(isDefined(types) && { types }),
        ...(isDefined(accountIds) && { accountIds }),
        ...(isDefined(tagIds) && { tagIds }),
        ...(isDefined(startDate) && { startDate }),
        ...(isDefined(endDate) && { endDate })
    };
};

// eslint-disable-next-line max-statements -- List orchestration component with multiple query hooks and handlers
export const TransactionList = ({ accountId = null, filters: externalFilters, showFilters = true, footerSpacerMultiplier }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const { activeFilters, setInternalFilters } = useTransactionListFilters(accountId, externalFilters);
    const hasFiltersSelected = checkIfFiltersSelected(accountId, activeFilters);
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);
    const { count: uncategorizedTransactionCount } = useGetUncategorizedTransactionCountQuery(activeFilters);
    const { count: transactionCount } = useGetTransactionCountQuery(activeFilters);

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;
    const emptyStateText = hasFiltersSelected
        ? { title: t`No matching transactions`, description: t`Try adjusting your filters to see more results` }
        : {
              title: t`No transactions yet`,
              description: t`Start tracking your spending by using the mic button or adding transactions manually`
          };
    const canShowUncategorizedPill = !isDefined(activeFilters.categoryIds) && isPositiveNumber(uncategorizedTransactionCount);
    const canShowTransactionCount = isPositiveNumber(transactionCount);
    const canShowListMeta = canShowUncategorizedPill || canShowTransactionCount;
    const transactionCountText = t({ message: plural(transactionCount, { one: '# transaction', other: '# transactions' }) });

    const handleUncategorizedPress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(activeFilters)
        });
    };

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={emptyStateText.title}
            titleClassName="text-md text-primary font-semibold"
            description={emptyStateText.description}
            descriptionClassName="text-center max-w-[250px]"
            testID={TransactionsPageSelector.EmptyState}
        />
    );

    const canShowFilters = showFilters && !externalFilters;

    return (
        <View className="flex-1">
            {canShowFilters && (
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    hasFiltersSelected={hasFiltersSelected}
                />
            )}

            {canShowListMeta ? (
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
            ) : null}

            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={balanceAdjustmentLabel}
                categoriesLabel={categoriesLabel}
                accountId={accountId}
                footerSpacerMultiplier={footerSpacerMultiplier}
            />
        </View>
    );
};
