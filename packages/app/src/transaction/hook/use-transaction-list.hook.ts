import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useGetTransactionsQuery } from '../query/use-get-transactions.query';
import { checkIfFiltersSelected } from '../utils/check-if-filters-selected.util';
import { getSingleAccountId } from '../utils/get-single-account-id.util';

export const useTransactionList = (scopeAccountIds: number[] | null) => {
    const [internalFilters, setInternalFilters] = useState<TransactionFilterInterface>(DEFAULT_TRANSACTION_FILTER);
    const activeFilters = isDefined(scopeAccountIds) ? { ...internalFilters, accountIds: scopeAccountIds } : internalFilters;
    const { sections, loadMore, isLoading } = useGetTransactionsQuery(activeFilters);
    const hasFiltersSelected = checkIfFiltersSelected(scopeAccountIds, activeFilters);

    return {
        activeFilters,
        rowAccountId: getSingleAccountId(scopeAccountIds),
        setInternalFilters,
        clearFilters: () => void setInternalFilters(DEFAULT_TRANSACTION_FILTER),
        hasFiltersSelected,
        isClearAllVisible: hasFiltersSelected && (isLoading || isNotEmptyArray(sections)),
        sections,
        loadMore,
        isLoading
    };
};
