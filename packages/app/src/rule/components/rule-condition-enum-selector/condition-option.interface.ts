import { MessageDescriptor } from '@lingui/core';

export interface ConditionOptionInterface<TValue extends string> {
    value: TValue;
    label: MessageDescriptor;
}
