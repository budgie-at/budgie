import { sql } from 'drizzle-orm';
import { index, int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { instrumentPairTableColumns } from '../../@generic/util/instrument-pair-table-columns.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { InstrumentMarketDataJobStatusEnum } from '../enum/instrument-market-data-job-status.enum';

export const InstrumentMarketDataJobEntityTable = sqliteTable(
    'instrument_market_data_jobs',
    withBaseEntityTableColumns({
        ...instrumentPairTableColumns(),
        fromDate: text('from_date').notNull(),
        toDate: text('to_date').notNull(),
        status: text('status', { enum: convertEnumToDrizzleEnum(InstrumentMarketDataJobStatusEnum) })
            .$type<InstrumentMarketDataJobStatusEnum>()
            .default(InstrumentMarketDataJobStatusEnum.PENDING)
            .notNull(),
        priority: int('priority', { mode: 'number' }).default(0).notNull(),
        attempts: int('attempts', { mode: 'number' }).default(0).notNull(),
        lockedAt: int('locked_at', { mode: 'timestamp' }),
        completedAt: int('completed_at', { mode: 'timestamp' }),
        lastError: text('last_error')
    }),
    table => [
        unique().on(table.instrumentId, table.quoteInstrumentId, table.fromDate, table.toDate),
        index('instrument_market_data_jobs_drain_idx')
            .on(table.status, sql`${table.priority} DESC`, table.updatedAt)
            .where(sql`${table.deletedAt} IS NULL`),
        index('instrument_market_data_jobs_lookup_idx')
            .on(table.instrumentId, table.quoteInstrumentId, table.status)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
