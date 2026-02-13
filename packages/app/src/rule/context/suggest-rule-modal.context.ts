import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

export interface SuggestRuleModalParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
}

export type SuggestRuleResultType = 'created' | 'dismissed';

interface SuggestRuleModalContextInterface {
    openSuggestRule: (params: SuggestRuleModalParams) => Promise<SuggestRuleResultType>;
    resolveSuggestRule: (result: SuggestRuleResultType) => void;
    currentParams: SuggestRuleModalParams | null;
}

export const SuggestRuleModalContext = createContext<SuggestRuleModalContextInterface>({
    openSuggestRule: () => Promise.resolve('dismissed' as const),
    resolveSuggestRule: emptyFn,
    currentParams: null
});

export const useSuggestRuleModal = () => use(SuggestRuleModalContext);
