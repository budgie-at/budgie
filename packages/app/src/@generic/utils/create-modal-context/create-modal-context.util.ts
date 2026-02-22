import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export type ModalContextTuple<TParams, TResult> = readonly [
    open: (params?: TParams) => Promise<TResult>,
    resolve: (result: TResult, options?: { readonly skipBack?: boolean }) => void,
    currentParams: TParams | null
];

export const createModalContext = <TParams, TResult>(
    defaultResult: TResult
): readonly [ModalContext: React.Context<ModalContextTuple<TParams, TResult>>, useModal: () => ModalContextTuple<TParams, TResult>] => {
    const ModalContext = createContext<ModalContextTuple<TParams, TResult>>([() => Promise.resolve(defaultResult), emptyFn, null]);

    const useModal = (): ModalContextTuple<TParams, TResult> => use(ModalContext);

    return [ModalContext, useModal] as const;
};
