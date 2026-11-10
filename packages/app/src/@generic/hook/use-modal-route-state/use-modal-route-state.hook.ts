import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

export const useModalRouteState = (currentParams: unknown) => {
    const router = useRouter();
    const hadParamsRef = useRef(isDefined(currentParams));

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
