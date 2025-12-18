import { useEffect, useState } from 'react';

import { authService } from '../service/auth.service';

interface BiometricAvailability {
    isTouchIdAvailable: boolean;
    isFaceIdAvailable: boolean;
    isSomeAvailable: boolean;
    isLoading: boolean;
}

export const useBiometricAvailability = (): BiometricAvailability => {
    const [state, setState] = useState<BiometricAvailability>({
        isTouchIdAvailable: false,
        isFaceIdAvailable: false,
        isSomeAvailable: false,
        isLoading: true
    });

    useEffect(() => {
        let isMounted = true;

        void authService.getBiometricTypes().then(result => {
            if (isMounted) {
                setState(result);
            }

            return result;
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return state;
};
