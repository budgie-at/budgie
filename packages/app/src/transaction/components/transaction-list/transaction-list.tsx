import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { useGetTransactionsQuery } from '../../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { TransactionFilters } from '../transaction-filters/transaction-filters';
import { TransactionSectionsList } from '../transaction-sections-list/transaction-sections-list';

interface Props {
    readonly accountId?: number | null;
    readonly filters?: TransactionFilterInterface;
    readonly showFilters?: boolean;
    readonly footerSpacerMultiplier?: number;
    readonly focusKey?: number;
}

export const TransactionList = ({
    accountId = null,
    filters: externalFilters,
    showFilters = true,
    footerSpacerMultiplier,
    focusKey
}: Props) => {
    const { t } = useLingui();

    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);

    const baseAccountIds = isDefined(accountId) ? [accountId] : null;
    const activeFilters = externalFilters ?? { ...internalFilters, accountIds: baseAccountIds ?? internalFilters.accountIds };
    const hasFiltersSelected = checkIfFiltersSelected(accountId, activeFilters);
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters, focusKey);

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;
    const emptyTitle = hasFiltersSelected ? t`No matching transactions` : t`No transactions yet`;
    const emptyDescription = hasFiltersSelected
        ? t`Try adjusting your filters to see more results`
        : t`Start tracking your spending by using the mic button or adding transactions manually`;

    const listEmptyState = isLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={emptyTitle}
            titleClassName="text-md text-primary font-semibold"
            description={emptyDescription}
            descriptionClassName="text-center max-w-[250px]"
            testID={TransactionsPageSelector.EmptyState}
        />
    );

    const canShowFilters = showFilters && !externalFilters;

    return (
        <View>
            {canShowFilters && (
                <TransactionFilters
                    filters={activeFilters}
                    onChange={setInternalFilters}
                    accountId={accountId}
                    hasFiltersSelected={hasFiltersSelected}
                />
            )}

            <TransactionSectionsList
                sections={sections}
                onEndReached={loadMore}
                listEmptyState={listEmptyState}
                balanceAdjustmentLabel={balanceAdjustmentLabel}
                categoriesLabel={categoriesLabel}
                footerSpacerMultiplier={footerSpacerMultiplier}
                focusKey={focusKey}
            />
        </View>
    );
};
