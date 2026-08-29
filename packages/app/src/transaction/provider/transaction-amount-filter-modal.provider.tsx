import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionAmountFilterModalContext } from '../context/transaction-amount-filter-modal.context';

import type { TransactionAmountFilterModalParams, TransactionAmountFilterResult } from '../context/transaction-amount-filter-modal.context';

export const TransactionAmountFilterModalProvider = createModalProvider<
    TransactionAmountFilterModalParams,
    TransactionAmountFilterResult | null
>(TransactionAmountFilterModalContext, '/transaction-amount-filter');
