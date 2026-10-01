import { defineRelationsPart } from 'drizzle-orm';

import { RuleEntityTable } from '../../rule/table/rule-entity.table';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

export const RuleConditionEntityRelations = defineRelationsPart(
    {
        RuleConditionEntityTable,
        RuleEntityTable
    },
    relation => ({
        RuleConditionEntityTable: {
            rule: relation.one.RuleEntityTable({
                from: relation.RuleConditionEntityTable.ruleId,
                to: relation.RuleEntityTable.id,
                optional: false
            })
        }
    })
);
