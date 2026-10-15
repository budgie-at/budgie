import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';

import { ScreenLayout } from '../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../@generic/constant/default-stack-options.constant';
import { OnboardingPinContext } from '../../onboarding/context/onboarding-pin.context';
import { useSetting } from '../../settings/hook/use-setting.hook';

const SEALED_SCREEN_OPTIONS = { gestureEnabled: false };

export default function OnboardingLayout() {
    const isOnboardingCompleted = useSetting('isOnboardingCompleted');
    const [pin, setPin] = useState<string | null>(null);

    const pinContextValue = { pin, setPin };

    if (isOnboardingCompleted) {
        return <Redirect href="/" />;
    }

    return (
        <OnboardingPinContext.Provider value={pinContextValue}>
            <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
                <Stack.Screen name="index" />
                <Stack.Screen name="pin" />
                <Stack.Screen name="seal" />
                <Stack.Screen name="sealed" options={SEALED_SCREEN_OPTIONS} />
                <Stack.Screen name="phone-lock" />
                <Stack.Screen name="accounts" />
                <Stack.Screen name="balances" />
                <Stack.Screen name="ai" />
            </Stack>
        </OnboardingPinContext.Provider>
    );
}
