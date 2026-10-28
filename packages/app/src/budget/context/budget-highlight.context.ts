import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { BudgetHighlightContextInterface } from '../interface/budget-highlight-context.interface';

export const BudgetHighlightContext = createContext<BudgetHighlightContextInterface>({ target: null, reveal: emptyFn });

export const useBudgetHighlightContext = () => use(BudgetHighlightContext);
