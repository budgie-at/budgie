import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export const TransactionEntryEntityTable = sqliteTable(
    'transaction_entries',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(TransactionEntryTypeEnum) })
            .$type<TransactionEntryTypeEnum>()
            .notNull(),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        categoryId: int('category_id', { mode: 'number' }).notNull(),
        parentCategoryId: int('parent_category_id', { mode: 'number' }).notNull(),
        parentAccountId: int('parent_account_id', { mode: 'number' }),
        instrumentId: int('instrument_id', { mode: 'number' }).notNull(),
        transactionId: int('transaction_id', { mode: 'number' }).notNull(),
        amount: int('amount', { mode: 'number' }).notNull()
    })
);
