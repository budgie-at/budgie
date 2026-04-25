import { TransactionCategoryFilterModeEnum } from '../enum/transaction-category-filter-mode.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';

export const DEFAULT_TRANSACTION_FILTER: TransactionFilterInterface = {
    date: null,
    types: null,
    tagIds: null,
    accountIds: null,
    categoryMode: TransactionCategoryFilterModeEnum.ALL,
    categoryIds: null
};
