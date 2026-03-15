import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appResetService } from '../service/app-reset.service';

const E2E_RESET_TOKEN_KEY = 'e2e-reset-token';

export const useBootstrapReset = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            try {
                const initialUrl = await Linking.parseInitialURLAsync();
                const resetToken = initialUrl.queryParams?.['e2eResetToken'];
                const normalizedResetToken = typeof resetToken === 'string' ? resetToken : '';
                const shouldReset = initialUrl.queryParams?.['e2eReset'] === 'true';

                if (isNotEmptyString(normalizedResetToken)) {
                    const lastConsumedToken = await SecureStore.getItemAsync(E2E_RESET_TOKEN_KEY);

                    if (lastConsumedToken !== normalizedResetToken) {
                        await appResetService.clearAllData();
                        await SecureStore.setItemAsync(E2E_RESET_TOKEN_KEY, normalizedResetToken);
                    }
                } else {
                    await SecureStore.deleteItemAsync(E2E_RESET_TOKEN_KEY);
                }

                if (shouldReset && !isNotEmptyString(normalizedResetToken)) {
                    await appResetService.clearAllData();
                }
            } finally {
                if (isMounted) {
                    setIsReady(true);
                }
            }
        };

        void bootstrap();

        return () => {
            isMounted = false;
        };
    }, []);

    return isReady;
};
