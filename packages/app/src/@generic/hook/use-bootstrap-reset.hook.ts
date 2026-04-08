import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { getE2ESettingsValue } from '../../@e2e/util/get-e2e-settings-value.util';
import { normalizeE2EStringValue } from '../../@e2e/util/normalize-e2e-string-value.util';
import { parseE2EBooleanValue } from '../../@e2e/util/parse-e2e-boolean-value.util';
import { appE2ECsvService } from '../service/app-e2e-csv.service';
import { appE2EFixtureImportService } from '../service/app-e2e-fixture-import.service';
import { appResetService } from '../service/app-reset.service';
import { reloadApp } from '../utils/reload-app.util';

const E2E_BOOTSTRAP_TOKEN_KEY = 'e2e-bootstrap-token';
const E2E_BOOTSTRAP_EVENT_TIMEOUT = 1000;

const isTestHooksEnabled = () => Constants.expoConfig?.extra?.e2eHooksEnabled === true;

const getBootstrapParamsFromQueryParams = (queryParams: Record<string, unknown> | null | undefined) => {
    const resetToken = normalizeE2EStringValue(queryParams?.e2eResetToken);
    const fixtureId = normalizeE2EStringValue(queryParams?.e2eImportFixture);
    const shouldReset = parseE2EBooleanValue(queryParams?.e2eReset);
    const shouldImportExportedCsv = parseE2EBooleanValue(queryParams?.e2eImportExportedCsv);
    const shouldImportFixtureCsv = parseE2EBooleanValue(queryParams?.e2eImportFixtureCsv);

    return {
        resetToken,
        fixtureId,
        shouldReset,
        shouldImportExportedCsv,
        shouldImportFixtureCsv,
        hasBootstrapAction: shouldReset || isNotEmptyString(fixtureId) || shouldImportExportedCsv || shouldImportFixtureCsv
    };
};

const getBootstrapParamsFromLaunchArguments = () =>
    getBootstrapParamsFromQueryParams({
        e2eResetToken: getE2ESettingsValue('e2eResetToken'),
        e2eImportFixture: getE2ESettingsValue('e2eImportFixture'),
        e2eReset: getE2ESettingsValue('e2eReset'),
        e2eImportExportedCsv: getE2ESettingsValue('e2eImportExportedCsv'),
        e2eImportFixtureCsv: getE2ESettingsValue('e2eImportFixtureCsv')
    });

const getBootstrapParamsFromUrl = (url: string) => {
    const parsedUrl = Linking.parse(url);

    return getBootstrapParamsFromQueryParams(parsedUrl.queryParams);
};

const getBootstrapParamsFromInitialUrl = async () => {
    const initialUrl = await Linking.getInitialURL();

    if (isNotEmptyString(initialUrl)) {
        return getBootstrapParamsFromUrl(initialUrl);
    }

    const parsedInitialUrl = await Linking.parseInitialURLAsync();

    return getBootstrapParamsFromQueryParams(parsedInitialUrl.queryParams);
};

const waitForBootstrapParamsFromUrlEvent = (initialBootstrapParams: ReturnType<typeof getBootstrapParamsFromQueryParams>) =>
    new Promise<ReturnType<typeof getBootstrapParamsFromQueryParams>>(resolve => {
        let isSettled = false;

        const subscription = Linking.addEventListener('url', event => {
            if (isSettled) {
                return;
            }

            isSettled = true;
            subscription.remove();
            resolve(getBootstrapParamsFromUrl(event.url));
        });

        setTimeout(() => {
            if (isSettled) {
                return;
            }

            isSettled = true;
            subscription.remove();
            resolve(initialBootstrapParams);
        }, E2E_BOOTSTRAP_EVENT_TIMEOUT);
    });

const getBootstrapParams = async () => {
    const launchArgumentBootstrapParams = getBootstrapParamsFromLaunchArguments();

    if (launchArgumentBootstrapParams.hasBootstrapAction) {
        return launchArgumentBootstrapParams;
    }

    const initialBootstrapParams = await getBootstrapParamsFromInitialUrl();

    if (initialBootstrapParams.hasBootstrapAction) {
        return initialBootstrapParams;
    }

    return waitForBootstrapParamsFromUrlEvent(initialBootstrapParams);
};

const clearBootstrapToken = async () => {
    await SecureStore.deleteItemAsync(E2E_BOOTSTRAP_TOKEN_KEY);
};

const consumeBootstrapToken = async (resetToken: string) => {
    await SecureStore.setItemAsync(E2E_BOOTSTRAP_TOKEN_KEY, resetToken);
};

const consumeBootstrapTokenAndReload = async (resetToken: string) => {
    await consumeBootstrapToken(resetToken);
    await reloadApp();
};

interface RunBootstrapActionInterface {
    readonly resetToken: string;
    readonly fixtureId: string;
    readonly shouldReset: boolean;
    readonly shouldImportExportedCsv: boolean;
    readonly shouldImportFixtureCsv: boolean;
}

const runFixtureImportBootstrapAction = async (fixtureId: string, resetToken: string) => {
    if (!isNotEmptyString(fixtureId)) {
        return false;
    }

    await appE2EFixtureImportService.importFixtureById(fixtureId);
    await consumeBootstrapTokenAndReload(resetToken);

    return true;
};

const runCsvImportBootstrapAction = async (resetToken: string, shouldImportExportedCsv: boolean, shouldImportFixtureCsv: boolean) => {
    if (shouldImportExportedCsv) {
        await appE2ECsvService.importExportedCsv();
        await consumeBootstrapTokenAndReload(resetToken);

        return true;
    }

    if (shouldImportFixtureCsv) {
        await appE2ECsvService.importFixtureCsv();
        await consumeBootstrapTokenAndReload(resetToken);

        return true;
    }

    return false;
};

const runImportBootstrapAction = async (
    fixtureId: string,
    resetToken: string,
    shouldImportExportedCsv: boolean,
    shouldImportFixtureCsv: boolean
) => {
    const didImportFixture = await runFixtureImportBootstrapAction(fixtureId, resetToken);

    if (didImportFixture) {
        return true;
    }

    return runCsvImportBootstrapAction(resetToken, shouldImportExportedCsv, shouldImportFixtureCsv);
};

const runBootstrapAction = async ({
    fixtureId,
    resetToken,
    shouldReset,
    shouldImportExportedCsv,
    shouldImportFixtureCsv
}: RunBootstrapActionInterface) => {
    const lastConsumedToken = await SecureStore.getItemAsync(E2E_BOOTSTRAP_TOKEN_KEY);

    if (lastConsumedToken === resetToken) {
        return;
    }

    if (shouldReset) {
        await appResetService.clearAllData();
    }

    const didRunImportAction = await runImportBootstrapAction(fixtureId, resetToken, shouldImportExportedCsv, shouldImportFixtureCsv);

    if (didRunImportAction) {
        return;
    }

    if (shouldReset) {
        await consumeBootstrapToken(resetToken);
    }
};

const bootstrapE2EState = async () => {
    if (!isTestHooksEnabled()) {
        return;
    }

    const bootstrapParams = await getBootstrapParams();

    if (isNotEmptyString(bootstrapParams.resetToken) && bootstrapParams.hasBootstrapAction) {
        await runBootstrapAction(bootstrapParams);

        return;
    }

    await clearBootstrapToken();
};

export const useBootstrapReset = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        void bootstrapE2EState().finally(() => {
            if (isMounted) {
                setIsReady(true);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return isReady;
};
