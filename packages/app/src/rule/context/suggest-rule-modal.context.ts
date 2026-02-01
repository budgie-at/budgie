import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

export interface SuggestRuleModalResult {
    readonly created: boolean;
}

interface SuggestRuleModalContextInterface {
    openSuggestRuleModal: (data: SuggestRuleDataInterface) => Promise<SuggestRuleModalResult | null>;
    resolveSuggestRuleModal: (result: SuggestRuleModalResult | null) => void;
    currentParams: SuggestRuleDataInterface | null;
}

export const SuggestRuleModalContext = createContext<SuggestRuleModalContextInterface>({
    openSuggestRuleModal: () => Promise.resolve(null),
    resolveSuggestRuleModal: emptyFn,
    currentParams: null
});

export const useSuggestRuleModal = () => use(SuggestRuleModalContext);
