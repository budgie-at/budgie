import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { UserIconNameEnum } from '../../generic/enum/user-icon-name.enum';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { AccountNatureEnum } from '../enum/account-nature.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';

export const AccountEntityTable = sqliteTable(
    'accounts',
    withBaseEntityTableColumns({
        icon: text({ enum: convertEnumToDrizzleEnum(UserIconNameEnum) })
            .$type<UserIconNameEnum>()
            .notNull(),
        parentId: int('parent_id', { mode: 'number' }),
        order: int({ mode: 'number' }).default(0).notNull(),
        title: text().default('').notNull(),
        type: text('type', { enum: convertEnumToDrizzleEnum(UserIconNameEnum) })
            .$type<AccountTypeEnum>()
            .notNull(),
        nature: text('nature', { enum: convertEnumToDrizzleEnum(AccountNatureEnum) })
            .$type<AccountNatureEnum>()
            .notNull(),
        instrumentId: int('instrument_id', { mode: 'number' }).notNull(),
        currentBalance: int('current_balance', { mode: 'number' }).default(0).notNull(),
        externalId: text('external_id'),
        externalSource: text('external_source', { enum: convertEnumToDrizzleEnum(ExternalSourceEnum) }).$type<ExternalSourceEnum>(),
        includeInNetWorth: int('include_in_net_worth', { mode: 'boolean' }).default(true).notNull()
    })
);
