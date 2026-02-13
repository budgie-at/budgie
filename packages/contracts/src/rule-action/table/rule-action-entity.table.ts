import { sql } from 'drizzle-orm';
import { check, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RuleActionTypeEnum } from '../../rule/enum/rule-action-type.enum';
import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';

export const RuleActionEntityTable = sqliteTable(
    'rule_actions',
    withBaseEntityTableColumns({
        ruleId: int('rule_id', { mode: 'number' })
            .notNull()
            .references(() => RuleEntityTable.id, { onDelete: 'cascade' }),
        type: text('type', { enum: convertEnumToDrizzleEnum(RuleActionTypeEnum) })
            .$type<RuleActionTypeEnum>()
            .notNull(),
        categoryId: int('category_id', { mode: 'number' }).references(() => CategoryEntityTable.id, { onDelete: 'cascade' }),
        tagId: int('tag_id', { mode: 'number' }).references(() => TagEntityTable.id, { onDelete: 'cascade' }),
        accountId: int('account_id', { mode: 'number' }).references(() => AccountEntityTable.id, { onDelete: 'cascade' })
    }),
    () => [
        check('rule_action_set_category_requires_category_id', sql`type != 'SET_CATEGORY' OR category_id IS NOT NULL`),
        check('rule_action_add_tag_requires_tag_id', sql`type != 'ADD_TAG' OR tag_id IS NOT NULL`),
        check('rule_action_convert_to_transfer_requires_account_id', sql`type != 'CONVERT_TO_TRANSFER' OR account_id IS NOT NULL`)
    ]
);
