import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { RuleConditionFormFieldEnum } from '../enum/rule-condition-form-field.enum';

export type RuleFieldValueType<T extends RuleConditionFormFieldEnum> = T extends RuleConditionFormFieldEnum.FIELD
    ? RuleConditionFieldEnum
    : RuleConditionOperatorEnum;
