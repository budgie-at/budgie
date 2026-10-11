import { TransactionTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface TransactionTypeFilterModalParams {
    readonly value: TransactionTypeEnum[] | null;
}

type TransactionTypeFilterResult = { readonly value: TransactionTypeEnum[] | null };

const [TransactionTypeFilterModalContext, useTransactionTypeFilterModal, useTransactionTypeFilterModalParams] = createModalContext<
    TransactionTypeFilterModalParams,
    TransactionTypeFilterResult | null
>(null);

export { useTransactionTypeFilterModal, useTransactionTypeFilterModalParams };

export const TransactionTypeFilterModalProvider = createModalProvider(TransactionTypeFilterModalContext, '/transaction-type-filter');
