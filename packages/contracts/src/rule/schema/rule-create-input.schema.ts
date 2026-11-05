import * as Schema from 'effect/Schema';

import { RuleActionCreateInputSchema } from '../../rule-action/schema/rule-action-create-input.schema';
import { RuleConditionCreateInputSchema } from '../../rule-condition/schema/rule-condition-create-input.schema';
import { RuleConditionMatchTypeEnum } from '../enum/rule-condition-match-type.enum';

export const RuleCreateInputSchema = Schema.Struct({
    enabled: Schema.Boolean,
    conditionMatchType: Schema.Enum(RuleConditionMatchTypeEnum),
    conditions: RuleConditionCreateInputSchema.pipe(Schema.Array, Schema.mutable),
    actions: RuleActionCreateInputSchema.pipe(Schema.Array, Schema.mutable)
});
