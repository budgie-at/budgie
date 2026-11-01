import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { HiddenAccountActionsInterface } from '../interface/hidden-account-actions.interface';

export const HiddenAccountActionsContext = createContext<HiddenAccountActionsInterface>({
    isLoading: false,
    unhide: emptyFn,
    archive: emptyFn
});

export const useHiddenAccountActions = () => use(HiddenAccountActionsContext);
