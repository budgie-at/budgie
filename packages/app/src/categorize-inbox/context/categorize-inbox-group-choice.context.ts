import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CategorizeInboxGroupChoiceContextValueInterface } from '../interface/categorize-inbox-group-choice-context-value.interface';

export const CategorizeInboxGroupChoiceContext = createContext<CategorizeInboxGroupChoiceContextValueInterface>({
    choice: null,
    select: emptyFn
});

export const useCategorizeInboxGroupChoiceContext = () => use(CategorizeInboxGroupChoiceContext);
