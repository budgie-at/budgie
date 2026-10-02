import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export type ModalContextTuple<TParams, TResult> = readonly [
    open: (params?: TParams) => Promise<TResult>,
    resolve: (result: TResult, options?: { readonly skipBack?: boolean }) => void
];

export const createModalContext = <TParams, TResult>(defaultResult: TResult) => {
    const ModalContext = createContext<ModalContextTuple<TParams, TResult>>([() => Promise.resolve(defaultResult), emptyFn]);
    const ModalParamsContext = createContext<TParams | null>(null);

    const useModal = (): ModalContextTuple<TParams, TResult> => use(ModalContext);
    const useModalParams = (): TParams | null => use(ModalParamsContext);

    return [[ModalContext, ModalParamsContext], useModal, useModalParams] as const;
};
