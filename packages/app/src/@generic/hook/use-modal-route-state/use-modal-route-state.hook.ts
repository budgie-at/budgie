import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../use-formsheet-list-styles/use-formsheet-list-styles.hook';

import type { ModalContextTuple } from '../../utils/create-modal-context/create-modal-context.util';

export const useModalRouteState = <TParams, TResult>(
    currentParams: TParams | null,
    resolve: ModalContextTuple<TParams, TResult>[1],
    emptyResult: TResult
) => {
    const router = useRouter();
    const { backgroundColor } = useFormsheetListStyles();
    const hadParamsRef = useRef(isDefined(currentParams));
    const resolveRef = useRef(resolve);
    const emptyResultRef = useRef(emptyResult);

    const screenOptions: React.ComponentProps<typeof Stack.Screen>['options'] = { contentStyle: { backgroundColor } };

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

    return { backgroundColor, screenOptions };
};
