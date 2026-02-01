import { RuleCreateInputInterface } from '@budgie/contracts';
import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { RuleFormResult } from '../components/rule-form/rule-form';
import { RuleFormModalContext } from '../context/rule-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const RuleFormModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<
        { ruleId?: number; input?: RuleCreateInputInterface } | null,
        RuleFormResult | null
    >('/rule-form');

    const value = { openRuleForm: open, resolveRuleForm: resolve, currentParams };

    return <RuleFormModalContext value={value}>{children}</RuleFormModalContext>;
};
