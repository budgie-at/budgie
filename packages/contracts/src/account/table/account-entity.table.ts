import { sql } from 'drizzle-orm';
import { index, int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { BankIntegrationEntityTable } from '../../bank-integration/table/bank-integration-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';
import { AccountNatureEnum } from '../enum/account-nature.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';

export const AccountEntityTable = sqliteTable(
    'accounts',
    withBaseEntityTableColumns({
        icon: text({ enum: convertEnumToDrizzleEnum(UserIconNameEnum) })
            .$type<UserIconNameEnum>()
            .default(UserIconNameEnum.Home)
            .notNull(),
        parentId: int('parent_id', { mode: 'number' }),
        order: int({ mode: 'number' }).default(0).notNull(),
        title: text().default('').notNull(),
        titleSearch: text('title_search').default('').notNull(),
        type: text('type', { enum: convertEnumToDrizzleEnum(AccountTypeEnum) })
            .$type<AccountTypeEnum>()
            .default(AccountTypeEnum.CASH)
            .notNull(),
        nature: text('nature', { enum: convertEnumToDrizzleEnum(AccountNatureEnum) })
            .$type<AccountNatureEnum>()
            .default(AccountNatureEnum.LIABILITY)
            .notNull(),
        debtType: text('debt_type', { enum: convertEnumToDrizzleEnum(AccountDebtTypeEnum) })
            .$type<AccountDebtTypeEnum>()
            .default(AccountDebtTypeEnum.LENT)
            .notNull(),
        instrumentId: int('instrument_id', { mode: 'number' })
            .notNull()
            .references(() => InstrumentEntityTable.id, { onDelete: 'cascade' }),
        externalId: text('external_id'),
        contactId: text('contact_id'),
        deadline: int('deadline', { mode: 'timestamp' }),
        targetBalance: int('target_balance', { mode: 'number' }).default(0).notNull(),
        targetBaseInstrumentId: int('target_base_instrument_id', { mode: 'number' }).references(() => InstrumentEntityTable.id, {
            onDelete: 'set null'
        }),
        targetBaseExchangeRate: real('target_base_exchange_rate'),
        targetBaseAmount: int('target_base_amount', { mode: 'number' }),
        interestRate: real('interest_rate'),
        externalSource: text('external_source', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) }).$type<ExternalSourceEnum>(),
        integrationId: int('integration_id', { mode: 'number' }).references(() => BankIntegrationEntityTable.id, { onDelete: 'set null' }),
        iban: text('iban'),
        includeInNetWorth: int('include_in_net_worth', { mode: 'boolean' }).default(true).notNull(),
        isActive: int('is_active', { mode: 'boolean' }).default(true).notNull()
    }),
    table => [
        index('accounts_iban_active_idx')
            .on(table.iban, table.isActive)
            .where(sql`${table.deletedAt} IS NULL AND ${table.iban} IS NOT NULL`),
        index('accounts_active_type_instrument_idx')
            .on(table.isActive, table.type, table.instrumentId)
            .where(sql`${table.deletedAt} IS NULL`)
    ]
);
