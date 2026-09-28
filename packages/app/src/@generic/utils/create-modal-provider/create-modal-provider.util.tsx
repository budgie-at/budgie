import { type Href } from 'expo-router';
import { type Context, type PropsWithChildren } from 'react';

import { useModalResolver } from '../../hook/use-modal-resolver/use-modal-resolver.hook';

import type { ModalContextTuple } from '../create-modal-context/create-modal-context.util';

export const createModalProvider = <TParams, TResult>(
    [ModalContext, ModalParamsContext]: readonly [Context<ModalContextTuple<TParams, TResult>>, Context<TParams | null>],
    route: Href
) => {
    const ModalProvider = ({ children }: PropsWithChildren) => {
        const { open, resolve, currentParams } = useModalResolver<TParams, TResult>(route);

        const value: ModalContextTuple<TParams, TResult> = [open, resolve];

        return (
            <ModalContext value={value}>
                <ModalParamsContext value={currentParams}>{children}</ModalParamsContext>
            </ModalContext>
        );
    };

    return ModalProvider;
};
