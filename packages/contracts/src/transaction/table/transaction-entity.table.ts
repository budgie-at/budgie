import { index, int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionEntityTable = sqliteTable(
    'transactions',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(TransactionTypeEnum) })
            .$type<TransactionTypeEnum>()
            .notNull(),
        title: text('title').notNull(),
        externalId: text('external_id'),
        operatedAt: int('operated_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
        comment: text('comment').default('').notNull(),
        toAccountId: int('to_account_id', { mode: 'number' }).references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        fromAccountId: int('from_account_id', { mode: 'number' }).references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        exchangeRate: real('exchange_rate').notNull(),
        externalSource: text('external_source', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) }).$type<ExternalSourceEnum>(),
        needsEmbedding: int('needs_embedding', { mode: 'boolean' }).notNull().default(false),
        operatedWeekday: int('operated_weekday', { mode: 'number' })
            .generatedAlwaysAs(sql`CAST(strftime('%w', operated_at, 'unixepoch') AS INTEGER)`, { mode: 'virtual' })
            .notNull(),
        operatedMinuteOfDay: int('operated_minute_of_day', { mode: 'number' })
            .generatedAlwaysAs(
                sql`CAST(strftime('%H', operated_at, 'unixepoch') AS INTEGER) * 60 + CAST(strftime('%M', operated_at, 'unixepoch') AS INTEGER)`,
                { mode: 'virtual' }
            )
            .notNull()
    }),
    table => [
        index('transactions_needs_embedding_idx').on(table.needsEmbedding, table.deletedAt),
        index('transactions_operated_at_idx').on(table.operatedAt).where(sql`${table.deletedAt} IS NULL`),
        index('transactions_type_operated_idx').on(table.type, table.operatedAt).where(sql`${table.deletedAt} IS NULL`),
        index('transactions_from_account_idx').on(table.fromAccountId).where(sql`${table.fromAccountId} IS NOT NULL`),
        index('transactions_to_account_idx').on(table.toAccountId).where(sql`${table.toAccountId} IS NOT NULL`),
        index('transactions_external_idx')
            .on(table.externalSource, table.externalId)
            .where(sql`${table.externalId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
        index('transactions_weekday_type_idx').on(table.operatedWeekday, table.type).where(sql`${table.deletedAt} IS NULL`),
        index('transactions_minute_of_day_idx').on(table.operatedMinuteOfDay).where(sql`${table.deletedAt} IS NULL`)
    ]
);
