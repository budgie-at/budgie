import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useE2ERuntimeContext } from '../../@e2e/context/e2e-runtime.context';
import { authService } from '../service/auth.service';

interface BiometricAvailability {
    isTouchIdAvailable: boolean;
    isFaceIdAvailable: boolean;
    isSomeAvailable: boolean;
    isLoading: boolean;
}

export const useBiometricAvailability = (): BiometricAvailability => {
    const { forceFaceId } = useE2ERuntimeContext();
    const [state, setState] = useState<BiometricAvailability>({
        isTouchIdAvailable: false,
        isFaceIdAvailable: false,
        isSomeAvailable: false,
        isLoading: true
    });

    useEffect(() => {
        if (forceFaceId) {
            return emptyFn;
        }

        let isMounted = true;

        void authService.getBiometricTypes().then(result => {
            if (!isMounted) {
                return result;
            }

            setState(result);

            return result;
        });

        return () => {
            isMounted = false;
        };
    }, [forceFaceId]);

    if (forceFaceId) {
        return {
            isTouchIdAvailable: false,
            isFaceIdAvailable: true,
            isSomeAvailable: true,
            isLoading: false
        };
    }

    return state;
};
