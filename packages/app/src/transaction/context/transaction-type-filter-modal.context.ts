import { TransactionTypeEnum } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface TransactionTypeFilterModalParams {
    readonly value: TransactionTypeEnum[] | null;
}

export type TransactionTypeFilterResult = { readonly value: TransactionTypeEnum[] | null };

interface TransactionTypeFilterModalContextInterface {
    openTransactionTypeFilter: (params: TransactionTypeFilterModalParams) => Promise<TransactionTypeFilterResult | null>;
    resolveTransactionTypeFilter: (result: TransactionTypeFilterResult | null) => void;
    currentParams: TransactionTypeFilterModalParams | null;
}

export const TransactionTypeFilterModalContext = createContext<TransactionTypeFilterModalContextInterface>({
    openTransactionTypeFilter: () => Promise.resolve(null),
    resolveTransactionTypeFilter: emptyFn,
    currentParams: null
});

export const useTransactionTypeFilterModal = () => use(TransactionTypeFilterModalContext);
