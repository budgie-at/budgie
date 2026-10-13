import { type Href, router } from 'expo-router';
import { useState } from 'react';

import type { ModalRequestInterface } from '../../interface/modal-request.interface';

interface ResolveOptions {
    readonly skipBack?: boolean;
}

interface UseModalResolverResult<TParams, TResult> {
    currentParams: TParams | null;
    open: (params?: TParams, onResult?: (result: TResult) => void) => void;
    resolve: (result: TResult, options?: ResolveOptions) => void;
    dismiss: () => void;
}

export const useModalResolver = <TParams, TResult>(route: Href, emptyResult: TResult): UseModalResolverResult<TParams, TResult> => {
    const [request, setRequest] = useState<ModalRequestInterface<TParams, TResult> | null>(null);

    const open = (params?: TParams, onResult?: (result: TResult) => void) => {
        setRequest({ params: params ?? null, onResult });
        router.push(route);
    };

    const resolve = (result: TResult, options?: ResolveOptions) => {
        setRequest(null);

        if (!options?.skipBack) {
            if (router.canDismiss()) {
                router.dismiss(1);
            } else if (router.canGoBack()) {
                router.back();
            }
        }

        request?.onResult?.(result);
    };

    const dismiss = () => {
        resolve(emptyResult, { skipBack: true });
    };

    return { currentParams: request?.params ?? null, open, resolve, dismiss };
};
