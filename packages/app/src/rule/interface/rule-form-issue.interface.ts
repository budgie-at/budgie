import type { MessageDescriptor } from '@lingui/core';

export interface RuleFormIssueInterface {
    readonly message: MessageDescriptor;
    readonly conditionIndex: number | null;
}
