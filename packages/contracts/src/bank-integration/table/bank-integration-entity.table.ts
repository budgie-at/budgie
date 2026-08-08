import { sql } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';

export const BankIntegrationEntityTable = sqliteTable(
    'bank_integrations',
    withBaseEntityTableColumns({
        provider: text('provider', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) })
            .$type<ExternalSourceEnum>()
            .notNull(),
        token: text('token').notNull()
    }),
    table => [
        uniqueIndex('bank_integrations_provider_token_unq')
            .on(table.provider, table.token)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
