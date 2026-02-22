import { TransactionTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TransactionTypeFilterModalParams {
    readonly value: TransactionTypeEnum[] | null;
}

export type TransactionTypeFilterResult = { readonly value: TransactionTypeEnum[] | null };

export const [TransactionTypeFilterModalContext, useTransactionTypeFilterModal] = createModalContext<
    TransactionTypeFilterModalParams,
    TransactionTypeFilterResult | null
>(null);
