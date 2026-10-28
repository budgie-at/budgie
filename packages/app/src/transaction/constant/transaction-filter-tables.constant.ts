import {
    AccountEntityTable,
    DebtEventEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';

export const TRANSACTION_FILTER_TABLES = [
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable,
    DebtEventEntityTable,
    AccountEntityTable
];
