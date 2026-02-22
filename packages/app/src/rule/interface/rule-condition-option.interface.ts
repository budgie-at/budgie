import { MessageDescriptor } from '@lingui/core';

export interface RuleConditionOptionInterface<TValue extends string> {
    value: TValue;
    label: MessageDescriptor;
}
