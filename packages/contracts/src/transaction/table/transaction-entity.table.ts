import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { TransactionTransferDirectionEnum } from '../enum/transaction-transfer-direction.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionEntityTable = sqliteTable(
    'transactions',
    withBaseEntityTableColumns({
        instrument: text(),
        categoryId: int('category_id', { mode: 'number' }),
        amount: int({ mode: 'number' }).default(0).notNull(),
        quantity: int({ mode: 'number' }).default(0).notNull(),
        pricePerUnit: int({ mode: 'number' }).default(0).notNull(),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        counterAccountId: int('counter_account_id', { mode: 'number' }),
        title: text().default('').notNull(),
        comment: text().default('').notNull(),
        type: text({ enum: convertEnumToDrizzleEnum(TransactionTypeEnum) })
            .default(TransactionTypeEnum.EXPENSE)
            .notNull(),
        transferDirection: text({ enum: convertEnumToDrizzleEnum(TransactionTransferDirectionEnum) })
            .default(TransactionTransferDirectionEnum.IN)
            .notNull(),
        operatedAt: int('operated_at', { mode: 'timestamp' }).default(CURRENT_TIMESTAMP).notNull()
    })
);
