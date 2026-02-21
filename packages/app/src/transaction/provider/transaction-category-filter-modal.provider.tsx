import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    TransactionCategoryFilterModalContext,
    TransactionCategoryFilterModalParams,
    TransactionCategoryFilterResult
} from '../context/transaction-category-filter-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TransactionCategoryFilterModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TransactionCategoryFilterModalParams, TransactionCategoryFilterResult | null>(
        '/transaction-category-filter'
    );

    const value = { openTransactionCategoryFilter: open, resolveTransactionCategoryFilter: resolve, currentParams };

    return <TransactionCategoryFilterModalContext value={value}>{children}</TransactionCategoryFilterModalContext>;
};
