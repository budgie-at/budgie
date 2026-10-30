import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useGetTransactionsQuery } from '../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../utils/check-if-filters-selected.util';
import { getSingleAccountId } from '../utils/get-single-account-id.util';

export const useTransactionList = (accountId: number | null) => {
    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);
    const activeFilters = isDefined(accountId) ? { ...internalFilters, accountIds: [accountId] } : internalFilters;
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);
    const hasFiltersSelected = checkIfFiltersSelected(accountId, activeFilters);

    return {
        activeFilters,
        rowAccountId: getSingleAccountId(activeFilters.accountIds),
        setInternalFilters,
        clearFilters: () => void setInternalFilters(DEFAULT_TRANSACTION_FILTER),
        hasFiltersSelected,
        isClearAllVisible: hasFiltersSelected && (isLoading || isNotEmptyArray(sections)),
        sections,
        loadMore,
        isLoading
    };
};
