import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TransactionCategoryFilterModalParams {
    readonly value: number[] | null;
}

export type TransactionCategoryFilterResult = { readonly value: number[] | null };

export const [TransactionCategoryFilterModalContext, useTransactionCategoryFilterModal] = createModalContext<
    TransactionCategoryFilterModalParams,
    TransactionCategoryFilterResult | null
>(null);
