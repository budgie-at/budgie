import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionTagFilterModalContext } from '../context/transaction-tag-filter-modal.context';

import type { TransactionTagFilterModalParams, TransactionTagFilterResult } from '../context/transaction-tag-filter-modal.context';

export const TransactionTagFilterModalProvider = createModalProvider<TransactionTagFilterModalParams, TransactionTagFilterResult | null>(
    TransactionTagFilterModalContext,
    '/transaction-tag-filter'
);
