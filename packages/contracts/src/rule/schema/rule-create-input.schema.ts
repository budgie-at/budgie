import * as Schema from 'effect/Schema';

import { RuleActionCreateInputSchema } from '../../rule-action/schema/rule-action-create-input.schema';
import { RuleConditionCreateInputSchema } from '../../rule-condition/schema/rule-condition-create-input.schema';
import { RuleConditionMatchTypeEnum } from '../enum/rule-condition-match-type.enum';

export const RuleCreateInputSchema = Schema.Struct({
    enabled: Schema.Boolean,
    conditionMatchType: Schema.Enum(RuleConditionMatchTypeEnum),
    conditions: Schema.mutable(Schema.Array(RuleConditionCreateInputSchema)),
    actions: Schema.mutable(Schema.Array(RuleActionCreateInputSchema))
});
