import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { TransactionIdsFilterResultInterface } from '../interface/transaction-ids-filter-result.interface';

interface TransactionCategoryFilterModalParams {
    readonly value: number[] | null;
}

const [TransactionCategoryFilterModalContext, useTransactionCategoryFilterModal, useTransactionCategoryFilterModalParams] =
    createModalContext<TransactionCategoryFilterModalParams, TransactionIdsFilterResultInterface | null>(null);

export { useTransactionCategoryFilterModal, useTransactionCategoryFilterModalParams };

export const TransactionCategoryFilterModalProvider = createModalProvider(
    TransactionCategoryFilterModalContext,
    '/transaction-category-filter'
);
