import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface TransactionAccountFilterModalParams {
    readonly value: number[] | null;
}

export interface TransactionAccountFilterResult {
    readonly value: number[] | null;
}

interface TransactionAccountFilterModalContextInterface {
    openTransactionAccountFilter: (params: TransactionAccountFilterModalParams) => Promise<TransactionAccountFilterResult | null>;
    resolveTransactionAccountFilter: (result: TransactionAccountFilterResult | null) => void;
    currentParams: TransactionAccountFilterModalParams | null;
}

export const TransactionAccountFilterModalContext = createContext<TransactionAccountFilterModalContextInterface>({
    openTransactionAccountFilter: () => Promise.resolve(null),
    resolveTransactionAccountFilter: emptyFn,
    currentParams: null
});

export const useTransactionAccountFilterModal = () => use(TransactionAccountFilterModalContext);
