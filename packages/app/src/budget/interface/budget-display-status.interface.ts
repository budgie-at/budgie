import type { BudgetPaceVariant } from '../type/budget-pace-variant.type';
import type { MessageDescriptor } from '@lingui/core';

export interface BudgetDisplayStatusInterface {
    readonly tone: BudgetPaceVariant;
    readonly label: MessageDescriptor;
    readonly isTight: boolean;
}
