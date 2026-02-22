import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionTypeFilterModalContext } from '../context/transaction-type-filter-modal.context';

import type { TransactionTypeFilterModalParams, TransactionTypeFilterResult } from '../context/transaction-type-filter-modal.context';

export const TransactionTypeFilterModalProvider = createModalProvider<TransactionTypeFilterModalParams, TransactionTypeFilterResult | null>(
    TransactionTypeFilterModalContext,
    '/transaction-type-filter'
);
