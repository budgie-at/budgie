import {
    AccountEntityTable,
    CategoryEntityTable,
    DebtEventEntityTable,
    DefaultCategoryTranslationEntityTable,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    TagEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionReceiptEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';

export const TRANSACTION_LIST_TABLES = [
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionReceiptEntityTable,
    TransactionTagsEntityTable,
    TagEntityTable,
    AccountEntityTable,
    InstrumentEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    MccCategoryEntityTable,
    DebtEventEntityTable
];
