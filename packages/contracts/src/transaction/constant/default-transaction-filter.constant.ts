import { TransactionFilterInterface } from '../interface/transaction-filter.interface';

export const DEFAULT_TRANSACTION_FILTER: TransactionFilterInterface = {
    date: null,
    types: null,
    amount: null,
    tagIds: null,
    accountIds: null,
    categoryIds: null
};
