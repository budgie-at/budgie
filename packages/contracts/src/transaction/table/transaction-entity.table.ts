import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionEntityTable = sqliteTable(
    'transactions',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(TransactionTypeEnum) })
            .$type<TransactionTypeEnum>()
            .notNull(),
        title: text('title').notNull(),
        externalId: text('external_id'),
        operatedAt: text('operated_at').notNull(),
        comment: text('comment').default('').notNull(),
        amount: int('amount', { mode: 'number' }).default(0).notNull(),
        toAccountId: int('to_account_id', { mode: 'number' }).references(() => AccountEntityTable.id),
        fromAccountId: int('from_account_id', { mode: 'number' }).references(() => AccountEntityTable.id),
        exchangeRate: real('exchange_rate').notNull(),
        externalSource: text('external_source', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) }).$type<ExternalSourceEnum>()
    })
);
