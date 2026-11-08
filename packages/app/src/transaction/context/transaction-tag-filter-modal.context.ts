import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { TransactionIdsFilterResultInterface } from '../interface/transaction-ids-filter-result.interface';

interface TransactionTagFilterModalParams {
    readonly value: number[] | null;
}

const [TransactionTagFilterModalContext, useTransactionTagFilterModal, useTransactionTagFilterModalParams] = createModalContext<
    TransactionTagFilterModalParams,
    TransactionIdsFilterResultInterface | null
>(null);

export { useTransactionTagFilterModal, useTransactionTagFilterModalParams };

export const TransactionTagFilterModalProvider = createModalProvider(TransactionTagFilterModalContext, '/transaction-tag-filter');
