import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useGetTransactionsQuery } from '../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../utils/check-if-filters-selected.util';

export const useTransactionList = (accountId: number | null) => {
    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);
    const activeFilters = isDefined(accountId) ? { ...internalFilters, accountIds: [accountId] } : internalFilters;
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);

    return {
        activeFilters,
        setInternalFilters,
        clearFilters: () => void setInternalFilters(DEFAULT_TRANSACTION_FILTER),
        hasFiltersSelected: checkIfFiltersSelected(accountId, activeFilters),
        sections,
        loadMore,
        isLoading
    };
};
