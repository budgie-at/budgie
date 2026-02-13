import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { SuggestRuleModalContext, SuggestRuleModalParams, SuggestRuleResultType } from '../context/suggest-rule-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const SuggestRuleModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<SuggestRuleModalParams, SuggestRuleResultType>('/suggest-rule');

    const value = { openSuggestRule: open, resolveSuggestRule: resolve, currentParams };

    return <SuggestRuleModalContext value={value}>{children}</SuggestRuleModalContext>;
};
