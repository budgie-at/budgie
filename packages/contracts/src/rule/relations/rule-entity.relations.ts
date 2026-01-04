import { relations } from 'drizzle-orm';

import { RuleActionEntityTable } from '../../rule-action/table/rule-action-entity.table';
import { RuleConditionEntityTable } from '../../rule-condition/table/rule-condition-entity.table';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

export const RuleEntityRelations = relations(RuleEntityTable, ({ many }) => ({
    [RuleAssociationEnum.CONDITIONS]: many(RuleConditionEntityTable),
    [RuleAssociationEnum.ACTIONS]: many(RuleActionEntityTable)
}));
