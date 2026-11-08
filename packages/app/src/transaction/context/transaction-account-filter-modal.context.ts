import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { TransactionIdsFilterResultInterface } from '../interface/transaction-ids-filter-result.interface';

interface TransactionAccountFilterModalParams {
    readonly value: number[] | null;
}

const [TransactionAccountFilterModalContext, useTransactionAccountFilterModal, useTransactionAccountFilterModalParams] = createModalContext<
    TransactionAccountFilterModalParams,
    TransactionIdsFilterResultInterface | null
>(null);

export { useTransactionAccountFilterModal, useTransactionAccountFilterModalParams };

export const TransactionAccountFilterModalProvider = createModalProvider(
    TransactionAccountFilterModalContext,
    '/transaction-account-filter'
);
