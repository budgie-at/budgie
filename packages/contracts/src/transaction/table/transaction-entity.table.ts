import { index, int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
        needsEmbedding: int('needs_embedding', { mode: 'boolean' }).notNull().default(false)
    }),
    table => [index('transactions_needs_embedding_idx').on(table.needsEmbedding, table.deletedAt)]
);
