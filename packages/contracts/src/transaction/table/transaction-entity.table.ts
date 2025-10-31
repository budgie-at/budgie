import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionEntityTable = sqliteTable(
    'transactions',
    withBaseEntityTableColumns({
        amount: int({ mode: 'number' }).default(0).notNull(),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        categoryId: int('category_id', { mode: 'number' }).notNull(),
        title: text().default('').notNull(),
        comment: text().default('').notNull(),
        type: text({ enum: convertEnumToDrizzleEnum(TransactionTypeEnum) })
            .default(TransactionTypeEnum.EXPENSE)
            .notNull(),
        operatedAt: int({ mode: 'timestamp' }).default(CURRENT_TIMESTAMP).notNull()
    })
);
