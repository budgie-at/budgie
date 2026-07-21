import { sql } from 'drizzle-orm';
import { index, int, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { DebtEventDirectionEnum } from '../enum/debt-event-direction.enum';
import { DebtEventSourceEnum } from '../enum/debt-event-source.enum';

export const DebtEventEntityTable = sqliteTable(
    'debt_events',
    withBaseEntityTableColumns({
        debtAccountId: int('debt_account_id', { mode: 'number' })
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' }),
        transactionId: int('transaction_id', { mode: 'number' }).references(() => TransactionEntityTable.id, {
            onDelete: 'cascade'
        }),
        transactionEntryId: int('transaction_entry_id', { mode: 'number' }).references(() => TransactionEntryEntityTable.id, {
            onDelete: 'set null'
        }),
        direction: text('direction', { enum: convertEnumToDrizzleEnum(DebtEventDirectionEnum) })
            .$type<DebtEventDirectionEnum>()
            .notNull(),
        source: text('source', { enum: convertEnumToDrizzleEnum(DebtEventSourceEnum) })
            .$type<DebtEventSourceEnum>()
            .notNull(),
        operatedAt: int('operated_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
        amount: int('amount', { mode: 'number' }).notNull(),
        baseAmount: int('base_amount', { mode: 'number' }),
        baseExchangeRate: real('base_exchange_rate'),
        baseInstrumentId: int('base_instrument_id', { mode: 'number' }).references(() => InstrumentEntityTable.id, {
            onDelete: 'set null'
        })
    }),
    table => [
        uniqueIndex('debt_events_live_transaction_unq')
            .on(table.transactionId)
            .where(sql`${table.transactionId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
        index('debt_events_transaction_idx')
            .on(table.transactionId)
            .where(sql`${table.transactionId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
        index('debt_events_transaction_entry_idx')
            .on(table.transactionEntryId)
            .where(sql`${table.transactionEntryId} IS NOT NULL AND ${table.deletedAt} IS NULL`),
        index('debt_events_account_transaction_idx')
            .on(table.debtAccountId, table.transactionId)
            .where(sql`${table.deletedAt} IS NULL`),
        index('debt_events_account_operated_idx')
            .on(table.debtAccountId, table.operatedAt)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
