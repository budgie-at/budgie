import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';

export interface RuleFormModalParams {
    readonly ruleId?: number;
    readonly prefillData?: RulePrefillDataInterface;
}

export type RuleFormResultType = 'created' | 'updated' | 'deleted' | null;

interface RuleFormModalContextInterface {
    openRuleForm: (params?: RuleFormModalParams) => Promise<RuleFormResultType>;
    resolveRuleForm: (result: RuleFormResultType) => void;
    currentParams: RuleFormModalParams | null;
}

export const RuleFormModalContext = createContext<RuleFormModalContextInterface>({
    openRuleForm: () => Promise.resolve(null),
    resolveRuleForm: emptyFn,
    currentParams: null
});

export const useRuleFormModal = () => use(RuleFormModalContext);
