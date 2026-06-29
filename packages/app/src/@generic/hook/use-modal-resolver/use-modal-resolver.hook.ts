import { type Href, router } from 'expo-router';
import { useRef, useState } from 'react';

interface ResolveOptions {
    readonly skipBack?: boolean;
}

interface UseModalResolverResult<TParams, TResult> {
    currentParams: TParams | null;
    open: (params?: TParams) => Promise<TResult>;
    resolve: (result: TResult, options?: ResolveOptions) => void;
}

export const useModalResolver = <TParams, TResult>(route: Href): UseModalResolverResult<TParams, TResult> => {
    const [currentParams, setCurrentParams] = useState<TParams | null>(null);
    const resolverRef = useRef<((result: TResult) => void) | null>(null);

    const open = (params?: TParams): Promise<TResult> =>
        new Promise(resolve => {
            setCurrentParams(params ?? null);
            resolverRef.current = resolve;
            router.push(route);
        });

    const resolve = (result: TResult, options?: ResolveOptions) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setCurrentParams(null);

        if (options?.skipBack) {
            return;
        }

        if (router.canDismiss()) {
            router.dismiss(1);

            return;
        }

        if (router.canGoBack()) {
            router.back();
        }
    };

    return { currentParams, open, resolve };
};
