import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { InstrumentTypeEnum } from '../enum/instrument-type.enum';

export const InstrumentEntityTable = sqliteTable(
    'instruments',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(InstrumentTypeEnum) })
            .$type<InstrumentTypeEnum>()
            .notNull(),
        code: text('code').notNull(),
        name: text('name').notNull(),
        symbol: text('symbol').notNull()
    }),
    columns => ({
        uidxCode: uniqueIndex('u_idx_instruments_code').on(columns.code)
    })
);
