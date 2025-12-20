import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { UserIconNameEnum } from '../../generic/enum/user-icon-name.enum';
import { convertEnumToDrizzleEnum } from '../../generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const CategoryEntityTable = sqliteTable(
    'categories',
    withBaseEntityTableColumns({
        title: text().default('').notNull(),
        icon: text({ enum: convertEnumToDrizzleEnum(UserIconNameEnum) })
            .$type<UserIconNameEnum>()
            .notNull(),
        parentId: int('parent_id', { mode: 'number' }),
        isDefault: int('is_default', { mode: 'boolean' }).default(false).notNull(),
        isSystemCategory: int('is_system_category', { mode: 'boolean' }).default(false).notNull(),
    })
);
