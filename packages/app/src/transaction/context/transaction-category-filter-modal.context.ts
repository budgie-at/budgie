import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface TransactionCategoryFilterModalParams {
    readonly value: number[] | null;
}

type TransactionCategoryFilterResult = { readonly value: number[] | null };

const [TransactionCategoryFilterModalContext, useTransactionCategoryFilterModal, useTransactionCategoryFilterModalParams] =
    createModalContext<TransactionCategoryFilterModalParams, TransactionCategoryFilterResult | null>(null);

export { useTransactionCategoryFilterModal, useTransactionCategoryFilterModalParams };

export const TransactionCategoryFilterModalProvider = createModalProvider(
    TransactionCategoryFilterModalContext,
    '/transaction-category-filter'
);
