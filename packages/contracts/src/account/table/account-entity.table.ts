import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CurrencyEnum } from '../../generic/enum/currency.enum';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';
import { AccountTypeEnum } from '../enum/account-type.enum';

export const AccountEntityTable = sqliteTable(
    'accounts',
    withBaseEntityTableColumns({
        balance: int({ mode: 'number' }).default(0).notNull(),
        title: text().default('').notNull(),
        type: text({ enum: Object.values(AccountTypeEnum) as [string, ...string[]] })
            .default(AccountTypeEnum.BANK)
            .notNull(),
        currency: text({ enum: Object.values(CurrencyEnum) as [string, ...string[]] })
            .default(CurrencyEnum.UAH)
            .notNull()
    })
);
