import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CreateActionActionsContextInterface } from '../interface/create-action-actions-context.interface';
import type { CreateActionInterface } from '../interface/create-action.interface';

export const CreateActionContext = createContext<CreateActionInterface | null>(null);

export const CreateMenuOpenContext = createContext(false);

export const CreateActionActionsContext = createContext<CreateActionActionsContextInterface>({
    setCreateAction: emptyFn,
    openMenu: emptyFn,
    setIsMenuOpen: emptyFn
});

export const useCreateActionValue = () => use(CreateActionContext);

export const useCreateMenuOpen = () => use(CreateMenuOpenContext);

export const useCreateActionActions = () => use(CreateActionActionsContext);
