import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { RuleMccSelectorModalContext, RuleMccSelectorModalParams } from '../context/rule-mcc-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const RuleMccSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<RuleMccSelectorModalParams, string | null>('/rule-mcc-selector');

    const value = { openRuleMccSelector: open, resolveRuleMccSelector: resolve, currentParams };

    return <RuleMccSelectorModalContext value={value}>{children}</RuleMccSelectorModalContext>;
};
