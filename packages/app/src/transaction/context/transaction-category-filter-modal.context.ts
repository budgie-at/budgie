import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface TransactionCategoryFilterModalParams {
    readonly value: number[] | null;
}

export interface TransactionCategoryFilterResult {
    readonly value: number[] | null;
}

interface TransactionCategoryFilterModalContextInterface {
    openTransactionCategoryFilter: (params: TransactionCategoryFilterModalParams) => Promise<TransactionCategoryFilterResult | null>;
    resolveTransactionCategoryFilter: (result: TransactionCategoryFilterResult | null) => void;
    currentParams: TransactionCategoryFilterModalParams | null;
}

export const TransactionCategoryFilterModalContext = createContext<TransactionCategoryFilterModalContextInterface>({
    openTransactionCategoryFilter: () => Promise.resolve(null),
    resolveTransactionCategoryFilter: emptyFn,
    currentParams: null
});

export const useTransactionCategoryFilterModal = () => use(TransactionCategoryFilterModalContext);
