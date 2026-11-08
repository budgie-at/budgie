import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../use-modal-dismiss/use-modal-dismiss.hook';

export const useModalRouteState = (currentParams: unknown, dismiss: () => void) => {
    const router = useRouter();
    const hadParamsRef = useRef(isDefined(currentParams));

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
};
