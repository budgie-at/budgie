import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { RuleFormModalContext, RuleFormModalParams, RuleFormResultType } from '../context/rule-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const RuleFormModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<RuleFormModalParams, RuleFormResultType>('/rule-form');

    const value = { openRuleForm: open, resolveRuleForm: resolve, currentParams };

    return <RuleFormModalContext value={value}>{children}</RuleFormModalContext>;
};
