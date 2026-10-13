import { AmountRangeInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface TransactionAmountFilterModalParams {
    readonly value: AmountRangeInterface | null;
}

type TransactionAmountFilterResult = { readonly value: AmountRangeInterface | null };

const [TransactionAmountFilterModalContext, useTransactionAmountFilterModal, useTransactionAmountFilterModalParams] = createModalContext<
    TransactionAmountFilterModalParams,
    TransactionAmountFilterResult | null
>(null);

export { useTransactionAmountFilterModal, useTransactionAmountFilterModalParams };

export const TransactionAmountFilterModalProvider = createModalProvider(TransactionAmountFilterModalContext, '/transaction-amount-filter');
