import { router } from 'expo-router';
import { useRef, useState } from 'react';

interface UseModalResolverResult<TParams, TResult> {
    currentParams: TParams | null;
    open: (params?: TParams) => Promise<TResult>;
    resolve: (result: TResult) => void;
}

export const useModalResolver = <TParams, TResult>(route: string): UseModalResolverResult<TParams, TResult> => {
    const [currentParams, setCurrentParams] = useState<TParams | null>(null);
    const resolverRef = useRef<((result: TResult) => void) | null>(null);

    const open = (params?: TParams): Promise<TResult> =>
        new Promise(resolve => {
            setCurrentParams((params ?? {}) as TParams);
            resolverRef.current = resolve;
            router.push(route as never);
        });

    const resolve = (result: TResult) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    return { currentParams, open, resolve };
};
