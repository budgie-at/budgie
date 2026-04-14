import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ReactNode, useEffect, useState } from 'react';

import { E2ERuntimeContext } from '../context/e2e-runtime.context';
import { E2ERuntimeOverridesInterface } from '../interface/e2e-runtime-overrides.interface';
import { e2eRuntimeService } from '../service/e2e-runtime.service';
import { getE2ESettingsValue } from '../util/get-e2e-settings-value.util';
import { parseE2EBooleanValue } from '../util/parse-e2e-boolean-value.util';
import { parseE2ENullableBooleanValue } from '../util/parse-e2e-nullable-boolean-value.util';

interface Props {
    readonly children: ReactNode;
}

const defaultValue: E2ERuntimeOverridesInterface = {
    forceProtected: false,
    forceFaceId: false,
    biometricAuthSuccess: null
};

// eslint-disable-next-line dot-notation
const isEnabled = () => Constants.expoConfig?.extra?.['e2eHooksEnabled'] === true;

/* eslint-disable dot-notation */
const buildOverridesFromQueryParams = (queryParams: Record<string, unknown> | null | undefined): E2ERuntimeOverridesInterface => ({
    forceProtected: parseE2EBooleanValue(queryParams?.['e2eForceProtected']),
    forceFaceId: parseE2EBooleanValue(queryParams?.['e2eForceFaceId']),
    biometricAuthSuccess: parseE2ENullableBooleanValue(queryParams?.['e2eBiometricAuthSuccess'])
});
/* eslint-enable dot-notation */

const getOverridesFromUrl = (url: string) => {
    const parsedUrl = Linking.parse(url);

    return buildOverridesFromQueryParams(parsedUrl.queryParams);
};

const getOverridesFromLaunchArguments = (): E2ERuntimeOverridesInterface => ({
    forceProtected: parseE2EBooleanValue(getE2ESettingsValue('e2eForceProtected')),
    forceFaceId: parseE2EBooleanValue(getE2ESettingsValue('e2eForceFaceId')),
    biometricAuthSuccess: parseE2ENullableBooleanValue(getE2ESettingsValue('e2eBiometricAuthSuccess'))
});

const getInitialOverrides = () => {
    if (!isEnabled()) {
        return defaultValue;
    }

    return getOverridesFromLaunchArguments();
};

export const E2ERuntimeProvider = ({ children }: Props) => {
    const [value, setValue] = useState<E2ERuntimeOverridesInterface>(getInitialOverrides);

    useEffect(() => {
        let isMounted = true;

        const applyValue = (nextValue: E2ERuntimeOverridesInterface) => {
            e2eRuntimeService.setOverrides(nextValue);

            if (isMounted) {
                setValue(nextValue);
            }
        };

        applyValue(getInitialOverrides());

        const subscription = Linking.addEventListener('url', event => {
            if (!isEnabled()) {
                return;
            }

            applyValue(getOverridesFromUrl(event.url));
        });

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);

    return <E2ERuntimeContext.Provider value={value}>{children}</E2ERuntimeContext.Provider>;
};
