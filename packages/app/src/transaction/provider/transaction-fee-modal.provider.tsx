import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { TransactionFeeModalContext } from '../context/transaction-fee-modal.context';

import type { TransactionFeeModalParamsInterface, TransactionFeeModalResult } from '../context/transaction-fee-modal.context';

export const TransactionFeeModalProvider = createModalProvider<TransactionFeeModalParamsInterface, TransactionFeeModalResult | null>(
    TransactionFeeModalContext,
    '/transaction-fee'
);
