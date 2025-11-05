import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CurrencyEnum } from '../../generic/enum/currency.enum';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { AccountTypeEnum } from '../enum/account-type.enum';

export const AccountEntityTable = sqliteTable(
    'accounts',
    withBaseEntityTableColumns({
        icon: text().notNull(),
        order: int({ mode: 'number' }).default(0).notNull(),
        balance: int({ mode: 'number' }).default(0).notNull(),
        title: text().default('').notNull(),
        type: text({ enum: convertEnumToDrizzleEnum(AccountTypeEnum) })
            .$type<AccountTypeEnum>()
            .default(AccountTypeEnum.BANK)
            .notNull(),
        currency: text({ enum: convertEnumToDrizzleEnum(CurrencyEnum) })
            .$type<CurrencyEnum>()
            .default(CurrencyEnum.UAH)
            .notNull(),
        includeInNetWorth: int({ mode: 'boolean' }).default(true).notNull()
    })
);
