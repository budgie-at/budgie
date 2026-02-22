import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface TransactionTagFilterModalParams {
    readonly value: number[] | null;
}

export interface TransactionTagFilterResult {
    readonly value: number[] | null;
}

interface TransactionTagFilterModalContextInterface {
    openTransactionTagFilter: (params: TransactionTagFilterModalParams) => Promise<TransactionTagFilterResult | null>;
    resolveTransactionTagFilter: (result: TransactionTagFilterResult | null, options?: { readonly skipBack?: boolean }) => void;
    currentParams: TransactionTagFilterModalParams | null;
}

export const TransactionTagFilterModalContext = createContext<TransactionTagFilterModalContextInterface>({
    openTransactionTagFilter: () => Promise.resolve(null),
    resolveTransactionTagFilter: emptyFn,
    currentParams: null
});

export const useTransactionTagFilterModal = () => use(TransactionTagFilterModalContext);
