import { defineRelationsPart } from 'drizzle-orm';

import { RuleActionEntityTable } from '../../rule-action/table/rule-action-entity.table';
import { RuleConditionEntityTable } from '../../rule-condition/table/rule-condition-entity.table';
import { RuleAssociationEnum } from '../enum/rule-association.enum';
import { RuleEntityTable } from '../table/rule-entity.table';

export const RuleEntityRelations = defineRelationsPart(
    {
        RuleActionEntityTable,
        RuleConditionEntityTable,
        RuleEntityTable
    },
    relation => ({
        RuleEntityTable: {
            [RuleAssociationEnum.CONDITIONS]: relation.many.RuleConditionEntityTable({
                from: relation.RuleEntityTable.id,
                to: relation.RuleConditionEntityTable.ruleId
            }),
            [RuleAssociationEnum.ACTIONS]: relation.many.RuleActionEntityTable({
                from: relation.RuleEntityTable.id,
                to: relation.RuleActionEntityTable.ruleId
            })
        }
    })
);
