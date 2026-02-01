import { isNotEmptyString } from '@rnw-community/shared';

import { RuleConditionOperatorEnum } from '../../rule/enum/rule-condition-operator.enum';

import { RuleConditionCreateEntitySchema } from './rule-condition-create-entity.schema';

export const RuleConditionCreateInputSchema = RuleConditionCreateEntitySchema.omit({ ruleId: true })
    .refine(data => isNotEmptyString(data.value), { message: 'Condition value is required', path: ['value'] })
    .refine(data => data.operator !== RuleConditionOperatorEnum.BETWEEN || isNotEmptyString(data.secondaryValue), {
        message: 'Secondary value is required for BETWEEN operator',
        path: ['secondaryValue']
    });
