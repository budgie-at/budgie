import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useResolveClassNames } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import type { ModalContextTuple } from '../../utils/create-modal-context/create-modal-context.util';

export const useModalRouteState = <TParams, TResult>(
    currentParams: TParams | null,
    resolve: ModalContextTuple<TParams, TResult>[1],
    emptyResult: TResult
) => {
    const router = useRouter();
    const contentStyle = useResolveClassNames('bg-primary-reverse');
    const hadParamsRef = useRef(isDefined(currentParams));
    const resolveRef = useRef(resolve);
    const emptyResultRef = useRef(emptyResult);

    const screenOptions: React.ComponentProps<typeof Stack.Screen>['options'] = { contentStyle };

    useEffect(() => {
        resolveRef.current = resolve;
        emptyResultRef.current = emptyResult;
    }, [resolve, emptyResult]);

    useEffect(
        () => () => {
            resolveRef.current(emptyResultRef.current, { skipBack: true });
        },
        []
    );

    useEffect(() => {
        if (isDefined(currentParams)) {
            hadParamsRef.current = true;

            return;
        }

        if (!hadParamsRef.current) {
            router.back();
        }
    }, [currentParams, router]);

    return screenOptions;
};
