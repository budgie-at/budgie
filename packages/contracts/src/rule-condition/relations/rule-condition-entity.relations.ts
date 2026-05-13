import { relations } from 'drizzle-orm';

import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

export const RuleConditionEntityRelations = relations(RuleConditionEntityTable, ({ one }) => ({
    rule: one(RuleEntityTable, {
        fields: [RuleConditionEntityTable.ruleId],
        references: [RuleEntityTable.id]
    })
}));
