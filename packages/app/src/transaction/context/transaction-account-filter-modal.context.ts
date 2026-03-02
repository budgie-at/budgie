import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TransactionAccountFilterModalParams {
    readonly value: number[] | null;
}

export type TransactionAccountFilterResult = { readonly value: number[] | null };

export const [TransactionAccountFilterModalContext, useTransactionAccountFilterModal] = createModalContext<
    TransactionAccountFilterModalParams,
    TransactionAccountFilterResult | null
>(null);
