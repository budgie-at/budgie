import * as Schema from 'effect/Schema';

import { RuleConditionFieldEnum } from '../../rule/enum/rule-condition-field.enum';
import { RuleConditionOperatorEnum } from '../../rule/enum/rule-condition-operator.enum';

export const RuleConditionCreateInputSchema = Schema.Struct({
    field: Schema.Enum(RuleConditionFieldEnum),
    operator: Schema.Enum(RuleConditionOperatorEnum),
    value: Schema.String,
    secondaryValue: Schema.NullOr(Schema.String)
});
