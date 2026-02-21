import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    TransactionTypeFilterModalContext,
    TransactionTypeFilterModalParams,
    TransactionTypeFilterResult
} from '../context/transaction-type-filter-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TransactionTypeFilterModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TransactionTypeFilterModalParams, TransactionTypeFilterResult | null>(
        '/transaction-type-filter'
    );

    const value = { openTransactionTypeFilter: open, resolveTransactionTypeFilter: resolve, currentParams };

    return <TransactionTypeFilterModalContext value={value}>{children}</TransactionTypeFilterModalContext>;
};
