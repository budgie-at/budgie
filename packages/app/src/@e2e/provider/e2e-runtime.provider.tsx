import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ReactNode, useEffect, useState } from 'react';

import { E2ERuntimeContext } from '../context/e2e-runtime.context';
import { E2ERuntimeOverridesInterface } from '../interface/e2e-runtime-overrides.interface';
import { e2eRuntimeService } from '../service/e2e-runtime.service';

interface Props {
    readonly children: ReactNode;
}

const defaultValue: E2ERuntimeOverridesInterface = {
    forceProtected: false,
    forceFaceId: false,
    biometricAuthSuccess: null
};

const isEnabled = () => Constants.expoConfig?.extra?.e2eHooksEnabled === true;

const parseBooleanQueryParam = (value: unknown) => value === 'true';

const parseNullableBooleanQueryParam = (value: unknown) => {
    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return null;
};

const buildOverridesFromQueryParams = (queryParams: Record<string, unknown> | null | undefined): E2ERuntimeOverridesInterface => ({
    forceProtected: parseBooleanQueryParam(queryParams?.e2eForceProtected),
    forceFaceId: parseBooleanQueryParam(queryParams?.e2eForceFaceId),
    biometricAuthSuccess: parseNullableBooleanQueryParam(queryParams?.e2eBiometricAuthSuccess)
});

const getOverrides = async () => {
    if (!isEnabled()) {
        return defaultValue;
    }

    const initialUrl = await Linking.getInitialURL();

    if (typeof initialUrl === 'string' && initialUrl.length > 0) {
        const parsedUrl = Linking.parse(initialUrl);

        return buildOverridesFromQueryParams(parsedUrl.queryParams);
    }

    const parsedInitialUrl = await Linking.parseInitialURLAsync();

    return buildOverridesFromQueryParams(parsedInitialUrl.queryParams);
};

export const E2ERuntimeProvider = ({ children }: Props) => {
    const [value, setValue] = useState<E2ERuntimeOverridesInterface | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const nextValue = await getOverrides();

            e2eRuntimeService.setOverrides(nextValue);

            if (isMounted) {
                setValue(nextValue);
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, []);

    if (value === null) {
        return null;
    }

    return <E2ERuntimeContext.Provider value={value}>{children}</E2ERuntimeContext.Provider>;
};
