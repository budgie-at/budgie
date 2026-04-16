import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CreateActionInterface } from '../interface/create-action.interface';

interface CreateActionContextInterface {
    createAction: CreateActionInterface | null;
    setCreateAction: (action: CreateActionInterface | null) => void;
    isMenuOpen: boolean;
    openMenu: () => void;
    setIsMenuOpen: (isOpen: boolean) => void;
}

export const CreateActionContext = createContext<CreateActionContextInterface>({
    createAction: null,
    setCreateAction: emptyFn,
    isMenuOpen: false,
    openMenu: emptyFn,
    setIsMenuOpen: emptyFn
});

export const useCreateActionContext = () => use(CreateActionContext);
