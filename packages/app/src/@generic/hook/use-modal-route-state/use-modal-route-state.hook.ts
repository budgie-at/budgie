import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useResolveClassNames } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../use-modal-dismiss/use-modal-dismiss.hook';

export const useModalRouteState = (currentParams: unknown, dismiss: () => void) => {
    const router = useRouter();
    const contentStyle = useResolveClassNames('bg-primary-reverse');
    const hadParamsRef = useRef(isDefined(currentParams));

    const screenOptions: React.ComponentProps<typeof Stack.Screen>['options'] = { contentStyle };

    useModalDismiss(dismiss);

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
