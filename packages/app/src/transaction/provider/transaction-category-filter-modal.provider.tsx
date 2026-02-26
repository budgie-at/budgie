import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionCategoryFilterModalContext } from '../context/transaction-category-filter-modal.context';

import type {
    TransactionCategoryFilterModalParams,
    TransactionCategoryFilterResult
} from '../context/transaction-category-filter-modal.context';

export const TransactionCategoryFilterModalProvider = createModalProvider<
    TransactionCategoryFilterModalParams,
    TransactionCategoryFilterResult | null
>(TransactionCategoryFilterModalContext, '/transaction-category-filter');
