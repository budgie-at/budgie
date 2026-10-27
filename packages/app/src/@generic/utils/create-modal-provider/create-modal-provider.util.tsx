import { type Href, router } from 'expo-router';
import { type Context, type PropsWithChildren, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { ModalContextTuple } from '../create-modal-context/create-modal-context.util';

export const createModalProvider = <TParams, TResult>(
    [ModalContext, ModalParamsContext, emptyResult]: readonly [
        Context<ModalContextTuple<TParams, TResult>>,
        Context<TParams | null>,
        TResult
    ],
    route: Href
) => {
    const ModalProvider = ({ children }: PropsWithChildren) => {
        const [params, setParams] = useState<TParams | null>(null);
        const pendingResultRef = useRef<{ readonly onResult?: (result: TResult) => void } | null>(null);

        const settle = (result: TResult) => {
            const pendingResult = pendingResultRef.current;

            pendingResultRef.current = null;
            setParams(null);
            pendingResult?.onResult?.(result);
        };

        const open: ModalContextTuple<TParams, TResult>[0] = (nextParams, onResult) => {
            pendingResultRef.current = { onResult };
            setParams(nextParams ?? null);
            router.push(route);
        };

        const resolve: ModalContextTuple<TParams, TResult>[1] = (result, options) => {
            if (!isDefined(pendingResultRef.current)) {
                return;
            }

            if (!options?.skipBack) {
                if (router.canDismiss()) {
                    router.dismiss(1);
                } else if (router.canGoBack()) {
                    router.back();
                }
            }

            settle(result);
        };

        const dismiss = () => {
            settle(emptyResult);
        };

        const value: ModalContextTuple<TParams, TResult> = [open, resolve, dismiss];

        return (
            <ModalContext value={value}>
                <ModalParamsContext value={params}>{children}</ModalParamsContext>
            </ModalContext>
        );
    };

    return ModalProvider;
};
