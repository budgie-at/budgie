import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appE2ECsvService } from '../service/app-e2e-csv.service';
import { appE2EFixtureImportService } from '../service/app-e2e-fixture-import.service';
import { appResetService } from '../service/app-reset.service';

const E2E_BOOTSTRAP_TOKEN_KEY = 'e2e-bootstrap-token';

const isTestHooksEnabled = () => Constants.expoConfig?.extra?.e2eHooksEnabled === true;

const normalizeQueryString = (value: unknown) => (typeof value === 'string' ? value : '');

const getBootstrapParamsFromQueryParams = (queryParams: Record<string, unknown> | null | undefined) => {
    const resetToken = normalizeQueryString(queryParams?.e2eResetToken);
    const fixtureId = normalizeQueryString(queryParams?.e2eImportFixture);
    const shouldReset = queryParams?.e2eReset === 'true';
    const shouldImportExportedCsv = queryParams?.e2eImportExportedCsv === 'true';

    return {
        resetToken,
        fixtureId,
        shouldReset,
        shouldImportExportedCsv,
        hasBootstrapAction: shouldReset || isNotEmptyString(fixtureId) || shouldImportExportedCsv
    };
};

const getBootstrapParams = async () => {
    const initialUrl = await Linking.getInitialURL();

    if (isNotEmptyString(initialUrl)) {
        const parsedUrl = Linking.parse(initialUrl);

        return getBootstrapParamsFromQueryParams(parsedUrl.queryParams);
    }

    const parsedInitialUrl = await Linking.parseInitialURLAsync();

    return getBootstrapParamsFromQueryParams(parsedInitialUrl.queryParams);
};

const consumeBootstrapToken = async (resetToken: string) => {
    await SecureStore.setItemAsync(E2E_BOOTSTRAP_TOKEN_KEY, resetToken);
};

const consumeBootstrapTokenAndReload = async (resetToken: string) => {
    await consumeBootstrapToken(resetToken);
    await Updates.reloadAsync();
};

const runBootstrapAction = async ({
    resetToken,
    fixtureId,
    shouldReset,
    shouldImportExportedCsv
}: {
    resetToken: string;
    fixtureId: string;
    shouldReset: boolean;
    shouldImportExportedCsv: boolean;
}) => {
    const lastConsumedToken = await SecureStore.getItemAsync(E2E_BOOTSTRAP_TOKEN_KEY);

    if (lastConsumedToken === resetToken) {
        return;
    }

    if (shouldReset) {
        await appResetService.clearAllData();
    }

    if (isNotEmptyString(fixtureId)) {
        await appE2EFixtureImportService.importFixtureById(fixtureId);
        await consumeBootstrapTokenAndReload(resetToken);

        return;
    }

    if (shouldImportExportedCsv) {
        await appE2ECsvService.importExportedCsv();
        await consumeBootstrapTokenAndReload(resetToken);

        return;
    }

    if (shouldReset) {
        await consumeBootstrapToken(resetToken);
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

                if (isNotEmptyString(bootstrapParams.resetToken) && bootstrapParams.hasBootstrapAction) {
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
