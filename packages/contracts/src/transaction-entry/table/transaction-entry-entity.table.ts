import { blob, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
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
        categoryId: int('category_id', { mode: 'number' })
            .notNull()
            .references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        instrumentId: int('instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        transactionId: int('transaction_id', { mode: 'number' })
            .notNull()
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' }),
        amount: blob('amount', { mode: 'bigint' }).notNull()
    })
);
