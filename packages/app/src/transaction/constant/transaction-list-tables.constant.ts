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
    TransactionTagsEntityTable
} from '@budgie/contracts';

export const TRANSACTION_LIST_TABLES = [
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable,
    TagEntityTable,
    AccountEntityTable,
    InstrumentEntityTable,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    MccCategoryEntityTable,
    DebtEventEntityTable
];
