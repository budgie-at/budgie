import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface RuleMccSelectorModalParams {
    readonly selectedMcc: string | null;
}

interface RuleMccSelectorModalContextInterface {
    openRuleMccSelector: (params?: RuleMccSelectorModalParams) => Promise<string | null>;
    resolveRuleMccSelector: (result: string | null) => void;
    currentParams: RuleMccSelectorModalParams | null;
}

export const RuleMccSelectorModalContext = createContext<RuleMccSelectorModalContextInterface>({
    openRuleMccSelector: () => Promise.resolve(null),
    resolveRuleMccSelector: emptyFn,
    currentParams: null
});

export const useRuleMccSelectorModal = () => use(RuleMccSelectorModalContext);
