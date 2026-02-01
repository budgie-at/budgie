import { RuleCreateInputInterface } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { RuleFormResult } from '../components/rule-form/rule-form';

interface RuleFormModalContextInterface {
    openRuleForm: (params?: { ruleId?: number; input?: RuleCreateInputInterface } | null) => Promise<RuleFormResult | null>;
    resolveRuleForm: (result: RuleFormResult | null) => void;
    currentParams: {
        ruleId?: number;
        input?: RuleCreateInputInterface;
    } | null;
}

export const RuleFormModalContext = createContext<RuleFormModalContextInterface>({
    openRuleForm: () => Promise.resolve(null),
    resolveRuleForm: emptyFn,
    currentParams: {}
});

export const useRuleFormModal = () => use(RuleFormModalContext);
