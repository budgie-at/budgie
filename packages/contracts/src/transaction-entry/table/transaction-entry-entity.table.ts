import { sql } from 'drizzle-orm';
import { index, int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export const TransactionEntryEntityTable = sqliteTable(
    'transaction_entries',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(TransactionEntryTypeEnum) })
            .$type<TransactionEntryTypeEnum>()
            .notNull(),
        accountId: int('account_id', { mode: 'number' })
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        categoryId: int('category_id', { mode: 'number' }).references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        mccCategoryId: int('mcc_category_id', { mode: 'number' }).references(() => MccCategoryEntityTable.id, { onDelete: 'set null' }),
        transactionId: int('transaction_id', { mode: 'number' })
            .notNull()
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' }),
        amount: int('amount', { mode: 'number' }).notNull(),
        externalId: text('external_id'),
        exchangeRate: real('exchange_rate').notNull().default(1),
        toIban: text('to_iban'),
        originalTransactionId: int('original_transaction_id', { mode: 'number' }).references(() => TransactionEntityTable.id, {
            onDelete: 'set null'
        })
    }),
    table => [
        index('transaction_entries_transaction_idx').on(table.transactionId),
        index('transaction_entries_account_idx').on(table.accountId),
        index('transaction_entries_original_transaction_idx')
            .on(table.originalTransactionId)
            .where(sql`${table.originalTransactionId} IS NOT NULL`),
        index('transaction_entries_ledger_account_idx')
            .on(table.accountId)
            .where(sql`${table.deletedAt} IS NULL AND ${table.originalTransactionId} IS NULL`),
        index('transaction_entries_category_idx')
            .on(table.categoryId)
            .where(sql`${table.categoryId} IS NOT NULL`),
        index('transaction_entries_category_type_idx')
            .on(table.categoryId, table.type)
            .where(sql`${table.categoryId} IS NOT NULL`)
    ]
);
