import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TransactionTagFilterModalParams {
    readonly value: number[] | null;
}

export type TransactionTagFilterResult = { readonly value: number[] | null };

export const [TransactionTagFilterModalContext, useTransactionTagFilterModal, useTransactionTagFilterModalParams] = createModalContext<
    TransactionTagFilterModalParams,
    TransactionTagFilterResult | null
>(null);
