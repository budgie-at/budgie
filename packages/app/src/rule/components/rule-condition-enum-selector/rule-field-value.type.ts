import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { RuleConditionFieldType } from './rule-condition-field.type';

export type RuleFieldValueType<T extends RuleConditionFieldType> = T extends 'field' ? RuleConditionFieldEnum : RuleConditionOperatorEnum;
