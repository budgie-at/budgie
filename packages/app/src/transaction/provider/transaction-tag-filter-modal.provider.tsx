import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    TransactionTagFilterModalContext,
    TransactionTagFilterModalParams,
    TransactionTagFilterResult
} from '../context/transaction-tag-filter-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TransactionTagFilterModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TransactionTagFilterModalParams, TransactionTagFilterResult | null>(
        '/transaction-tag-filter'
    );

    const value = { openTransactionTagFilter: open, resolveTransactionTagFilter: resolve, currentParams };

    return <TransactionTagFilterModalContext value={value}>{children}</TransactionTagFilterModalContext>;
};
