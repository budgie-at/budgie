import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appE2EFixtureImportService } from '../service/app-e2e-fixture-import.service';
import { appResetService } from '../service/app-reset.service';

const E2E_BOOTSTRAP_TOKEN_KEY = 'e2e-bootstrap-token';

const isTestHooksEnabled = () => Constants.expoConfig?.extra?.['e2eHooksEnabled'] === true;

const normalizeQueryString = (value: unknown) => (typeof value === 'string' ? value : '');

const getBootstrapParams = async () => {
    const initialUrl = await Linking.parseInitialURLAsync();
    const resetToken = normalizeQueryString(initialUrl.queryParams?.['e2eResetToken']);
    const fixtureId = normalizeQueryString(initialUrl.queryParams?.['e2eImportFixture']);
    const shouldReset = initialUrl.queryParams?.['e2eReset'] === 'true';

    return {
        resetToken,
        fixtureId,
        shouldReset,
        hasBootstrapAction: shouldReset || isNotEmptyString(fixtureId)
    };
};

const runBootstrapAction = async ({
    resetToken,
    fixtureId,
    shouldReset
}: {
    resetToken: string;
    fixtureId: string;
    shouldReset: boolean;
}) => {
    const lastConsumedToken = await SecureStore.getItemAsync(E2E_BOOTSTRAP_TOKEN_KEY);

    if (lastConsumedToken === resetToken) {
        return;
    }

    if (isNotEmptyString(fixtureId)) {
        await appE2EFixtureImportService.importFixtureById(fixtureId);
        await SecureStore.setItemAsync(E2E_BOOTSTRAP_TOKEN_KEY, resetToken);
        await Updates.reloadAsync();

        return;
    }

    if (shouldReset) {
        await appResetService.clearAllData();
        await SecureStore.setItemAsync(E2E_BOOTSTRAP_TOKEN_KEY, resetToken);
    }
};

export const useBootstrapReset = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            try {
                if (!isTestHooksEnabled()) {
                    return;
                }

                const bootstrapParams = await getBootstrapParams();

                if (
                    isNotEmptyString(bootstrapParams.resetToken) &&
                    bootstrapParams.hasBootstrapAction
                ) {
                    await runBootstrapAction(bootstrapParams);
                } else {
                    await SecureStore.deleteItemAsync(E2E_BOOTSTRAP_TOKEN_KEY);
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
