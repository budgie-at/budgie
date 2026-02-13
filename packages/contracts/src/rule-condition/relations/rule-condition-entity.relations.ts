import { relations } from 'drizzle-orm';

import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { RuleConditionAssociationEnum } from '../enum/rule-condition-association.enum';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

export const RuleConditionEntityRelations = relations(RuleConditionEntityTable, ({ one }) => ({
    [RuleConditionAssociationEnum.RULE]: one(RuleEntityTable, {
        fields: [RuleConditionEntityTable.ruleId],
        references: [RuleEntityTable.id]
    })
}));
