import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';

export const AccountBudgetExclusionEntityTable = sqliteTable(
    'account_budget_exclusions',
    withBaseEntityTableColumns({
        accountId: int('account_id')
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' })
            .unique()
    })
);
