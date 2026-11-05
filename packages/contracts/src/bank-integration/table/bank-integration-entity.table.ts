import { sql } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';

export const BankIntegrationEntityTable = sqliteTable(
    'bank_integrations',
    withBaseEntityTableColumns({
        ...withSyncIdentityColumns(),
        provider: text('provider', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) })
            .$type<ExternalSourceEnum>()
            .notNull(),
        token: text('token').notNull(),
        label: text('label'),
        externalClientId: text('external_client_id'),
        historyProgress: text('history_progress'),
        ownerInstallId: text('owner_install_id')
    }),
    table => [
        syncIdentityUniqueIndex('bank_integrations', table),
        uniqueIndex('bank_integrations_provider_token_unq')
            .on(table.provider, table.token)
            .where(sql`${table.deletedAt} IS NULL`),
        uniqueIndex('bank_integrations_provider_file_import_unq')
            .on(table.provider)
            .where(sql`${table.token} = '' AND ${table.deletedAt} IS NULL`)
    ]
);
