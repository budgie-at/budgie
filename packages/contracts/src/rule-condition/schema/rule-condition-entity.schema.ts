import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { RuleConditionFieldEnum } from '../../rule/enum/rule-condition-field.enum';
import { RuleConditionOperatorEnum } from '../../rule/enum/rule-condition-operator.enum';
import { RuleConditionEntityTable } from '../table/rule-condition-entity.table';

export const RuleConditionEntitySchema = createSelectSchema(RuleConditionEntityTable, {
    ...BaseEntityFields,
    ruleId: schema => schema.describe('The rule ID this condition belongs to.'),
    field: zodEnum(RuleConditionFieldEnum).describe('The transaction field to match.'),
    operator: zodEnum(RuleConditionOperatorEnum).describe('The comparison operator.'),
    value: schema => schema.describe('The value to compare against.'),
    secondaryValue: schema => schema.nullable().describe('Secondary value for range operators like BETWEEN.')
});
