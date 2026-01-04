import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { ConditionFieldType } from './condition-field.type';

export type FieldValueType<T extends ConditionFieldType> = T extends 'field' ? RuleConditionFieldEnum : RuleConditionOperatorEnum;
