import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionAccountFilterModalContext } from '../context/transaction-account-filter-modal.context';

import type {
    TransactionAccountFilterModalParams,
    TransactionAccountFilterResult
} from '../context/transaction-account-filter-modal.context';

export const TransactionAccountFilterModalProvider = createModalProvider<
    TransactionAccountFilterModalParams,
    TransactionAccountFilterResult | null
>(TransactionAccountFilterModalContext, '/transaction-account-filter');
