import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';
import { RuleConditionMatchTypeEnum } from '../enum/rule-condition-match-type.enum';

export const RuleEntityTable = sqliteTable(
    'rules',
    withBaseEntityTableColumns({
        ...withSyncIdentityColumns(),
        enabled: int('enabled', { mode: 'boolean' }).notNull().default(true),
        conditionMatchType: text('condition_match_type', { enum: [RuleConditionMatchTypeEnum.ALL, RuleConditionMatchTypeEnum.ANY] })
            .$type<RuleConditionMatchTypeEnum>()
            .notNull()
            .default(RuleConditionMatchTypeEnum.ALL)
    }),
    table => [syncIdentityUniqueIndex('rules', table)]
);
