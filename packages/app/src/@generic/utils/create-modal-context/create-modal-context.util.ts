import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export type ModalContextTuple<TParams, TResult> = readonly [
    open: (params?: TParams, onResult?: (result: TResult) => void) => void,
    resolve: (result: TResult, options?: { readonly skipBack?: boolean }) => void,
    dismiss: () => void
];

export const createModalContext = <TParams, TResult>(defaultResult: TResult) => {
    const ModalContext = createContext<ModalContextTuple<TParams, TResult>>([
        (_params, onResult) => {
            onResult?.(defaultResult);
        },
        emptyFn,
        emptyFn
    ]);
    const ModalParamsContext = createContext<TParams | null>(null);

    const useModal = (): ModalContextTuple<TParams, TResult> => use(ModalContext);
    const useModalParams = (): TParams | null => use(ModalParamsContext);

    return [[ModalContext, ModalParamsContext, defaultResult], useModal, useModalParams] as const;
};
