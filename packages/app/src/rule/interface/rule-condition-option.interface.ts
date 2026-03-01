import { MessageDescriptor } from '@lingui/core';

export interface RuleConditionOptionInterface<TValue extends string> {
    readonly value: TValue;
    readonly label: MessageDescriptor;
}
