import { getLogger } from '@budgie/logger';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { ScreenLayout } from '../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../@generic/constant/default-stack-options.constant';
import { onboardingService } from '../../onboarding/service/onboarding.service';
import { useSetting } from '../../settings/hook/use-setting.hook';

const logger = getLogger('OnboardingLayout');

export default function OnboardingLayout() {
    const onboardingStep = useSetting('onboardingStep');
    const runFreshInstallInitRef = useRef(() => {
        if (onboardingStep !== 0) {
            return;
        }

        void onboardingService.initializeLocale().catch((error: unknown) => {
            logger.error('initialize locale failed', { errorMessage: getErrorMessage(error) });
        });
    });

    // oxlint-disable-next-line react/exhaustive-deps -- mount-only initialization; the ref captures the value at mount
    useEffect(() => {
        runFreshInstallInitRef.current();
    }, []);

    return (
        <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
            <Stack.Screen name="index" />
            <Stack.Screen name="track" />
            <Stack.Screen name="balances" />
            <Stack.Screen name="expense" />
            <Stack.Screen name="budget" />
            <Stack.Screen name="lock" />
            <Stack.Screen name="ai" />
            <Stack.Screen name="done" />
        </Stack>
    );
}
