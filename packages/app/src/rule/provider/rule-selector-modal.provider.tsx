import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { RuleSelectorModalContext, RuleSelectorModalParams } from '../context/rule-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const RuleSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<RuleSelectorModalParams, string | null>('/rule-selector');

    const value = { openRuleSelector: open, resolveRuleSelector: resolve, currentParams };

    return <RuleSelectorModalContext value={value}>{children}</RuleSelectorModalContext>;
};
