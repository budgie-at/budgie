import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    TransactionAccountFilterModalContext,
    TransactionAccountFilterModalParams,
    TransactionAccountFilterResult
} from '../context/transaction-account-filter-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TransactionAccountFilterModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TransactionAccountFilterModalParams, TransactionAccountFilterResult | null>(
        '/transaction-account-filter'
    );

    const value = { openTransactionAccountFilter: open, resolveTransactionAccountFilter: resolve, currentParams };

    return <TransactionAccountFilterModalContext value={value}>{children}</TransactionAccountFilterModalContext>;
};
