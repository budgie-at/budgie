import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface TransactionTagFilterModalParams {
    readonly value: number[] | null;
}

type TransactionTagFilterResult = { readonly value: number[] | null };

const [TransactionTagFilterModalContext, useTransactionTagFilterModal, useTransactionTagFilterModalParams] = createModalContext<
    TransactionTagFilterModalParams,
    TransactionTagFilterResult | null
>(null);

export { useTransactionTagFilterModal, useTransactionTagFilterModalParams };

export const TransactionTagFilterModalProvider = createModalProvider(TransactionTagFilterModalContext, '/transaction-tag-filter');
