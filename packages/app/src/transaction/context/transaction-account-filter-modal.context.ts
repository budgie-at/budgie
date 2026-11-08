import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface TransactionAccountFilterModalParams {
    readonly value: number[] | null;
}

type TransactionAccountFilterResult = { readonly value: number[] | null };

const [TransactionAccountFilterModalContext, useTransactionAccountFilterModal, useTransactionAccountFilterModalParams] = createModalContext<
    TransactionAccountFilterModalParams,
    TransactionAccountFilterResult | null
>(null);

export { useTransactionAccountFilterModal, useTransactionAccountFilterModalParams };

export const TransactionAccountFilterModalProvider = createModalProvider(
    TransactionAccountFilterModalContext,
    '/transaction-account-filter'
);
