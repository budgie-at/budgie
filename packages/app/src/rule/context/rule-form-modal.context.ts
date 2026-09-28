import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';

export interface RuleFormModalParams {
    readonly ruleId?: number;
    readonly prefillData?: RulePrefillDataInterface;
}

export type RuleFormResultType = 'created' | 'updated' | 'deleted' | null;

export const [RuleFormModalContext, useRuleFormModal, useRuleFormModalParams] = createModalContext<RuleFormModalParams, RuleFormResultType>(
    null
);
