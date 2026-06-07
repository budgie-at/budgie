import { AmountRangeInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TransactionAmountFilterModalParams {
    readonly value: AmountRangeInterface | null;
}

export type TransactionAmountFilterResult = { readonly value: AmountRangeInterface | null };

export const [TransactionAmountFilterModalContext, useTransactionAmountFilterModal] = createModalContext<
    TransactionAmountFilterModalParams,
    TransactionAmountFilterResult | null
>(null);
