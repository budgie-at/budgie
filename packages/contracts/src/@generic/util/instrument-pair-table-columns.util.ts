import { int } from 'drizzle-orm/sqlite-core';

import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';

export const instrumentPairTableColumns = () => ({
    instrumentId: int('instrument_id', { mode: 'number' })
        .notNull()
        .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
    quoteInstrumentId: int('quote_instrument_id', { mode: 'number' })
        .notNull()
        .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' })
});
