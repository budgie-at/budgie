import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { ArchivedAccountActionsInterface } from '../interface/archived-account-actions.interface';

export const ArchivedAccountActionsContext = createContext<ArchivedAccountActionsInterface>({
    isLoading: false,
    restore: emptyFn,
    deleteAccount: emptyFn
});

export const useArchivedAccountActions = () => use(ArchivedAccountActionsContext);
