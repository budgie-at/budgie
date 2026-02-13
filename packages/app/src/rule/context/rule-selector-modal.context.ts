import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface RuleSelectorOptionInterface {
    readonly value: string;
    readonly label: string;
}

export interface RuleSelectorModalParams {
    readonly title: string;
    readonly options: RuleSelectorOptionInterface[];
    readonly selectedValue: string | null;
}

interface RuleSelectorModalContextInterface {
    openRuleSelector: (params: RuleSelectorModalParams) => Promise<string | null>;
    resolveRuleSelector: (result: string | null) => void;
    currentParams: RuleSelectorModalParams | null;
}

export const RuleSelectorModalContext = createContext<RuleSelectorModalContextInterface>({
    openRuleSelector: () => Promise.resolve(null),
    resolveRuleSelector: emptyFn,
    currentParams: null
});

export const useRuleSelectorModal = () => use(RuleSelectorModalContext);
