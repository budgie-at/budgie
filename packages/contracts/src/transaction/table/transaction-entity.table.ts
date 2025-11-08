import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const TransactionEntityTable = sqliteTable(
    'transactions',
    withBaseEntityTableColumns({
        type: text('type', { enum: convertEnumToDrizzleEnum(TransactionTypeEnum) })
            .$type<TransactionTypeEnum>()
            .notNull(),
        externalId: text('external_id'),
        operatedAt: text('operated_at').notNull(),
        exchangeRate: int('exchange_rate', { mode: 'number' }).notNull(),
        externalSource: text('external_source', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) }).$type<ExternalSourceEnum>()
    })
);
