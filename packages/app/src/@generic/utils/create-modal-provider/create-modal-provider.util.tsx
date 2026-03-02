import { type Context, type PropsWithChildren } from 'react';

import { useModalResolver } from '../../hook/use-modal-resolver/use-modal-resolver.hook';

import type { ModalContextTuple } from '../create-modal-context/create-modal-context.util';

export const createModalProvider = <TParams, TResult>(ModalContext: Context<ModalContextTuple<TParams, TResult>>, route: string) => {
    const ModalProvider = ({ children }: PropsWithChildren) => {
        const { open, resolve, currentParams } = useModalResolver<TParams, TResult>(route);

        const value: ModalContextTuple<TParams, TResult> = [open, resolve, currentParams];

        return <ModalContext value={value}>{children}</ModalContext>;
    };

    return ModalProvider;
};
