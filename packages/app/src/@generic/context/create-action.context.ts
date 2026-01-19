import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CreateActionInterface } from '../interface/create-action.interface';

interface CreateActionContextInterface {
    createAction: CreateActionInterface | null;
    setCreateAction: (action: CreateActionInterface | null) => void;
    accountId: number | null;
    setAccountId: (accountId: number | null) => void;
}

export const CreateActionContext = createContext<CreateActionContextInterface>({
    createAction: null,
    setCreateAction: emptyFn,
    accountId: null,
    setAccountId: emptyFn
});

export const useCreateActionContext = () => use(CreateActionContext);
