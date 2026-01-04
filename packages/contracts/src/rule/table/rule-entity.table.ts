import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { RuleConditionMatchTypeEnum } from '../enum/rule-condition-match-type.enum';

export const RuleEntityTable = sqliteTable(
    'rules',
    withBaseEntityTableColumns({
        title: text('title').notNull(),
        titleSearch: text('title_search').default('').notNull(),
        enabled: int('enabled', { mode: 'boolean' }).notNull().default(true),
        conditionMatchType: text('condition_match_type', { enum: [RuleConditionMatchTypeEnum.ALL, RuleConditionMatchTypeEnum.ANY] })
            .$type<RuleConditionMatchTypeEnum>()
            .notNull()
            .default(RuleConditionMatchTypeEnum.ALL)
    })
);
