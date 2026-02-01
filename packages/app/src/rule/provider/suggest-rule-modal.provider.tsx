import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { SuggestRuleModalContext, SuggestRuleModalResult } from '../context/suggest-rule-modal.context';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

interface Props {
    readonly children: ReactNode;
}

export const SuggestRuleModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<SuggestRuleDataInterface, SuggestRuleModalResult | null>(
        '/suggest-rule-modal'
    );

    const value = { openSuggestRuleModal: open, resolveSuggestRuleModal: resolve, currentParams };

    return <SuggestRuleModalContext value={value}>{children}</SuggestRuleModalContext>;
};
