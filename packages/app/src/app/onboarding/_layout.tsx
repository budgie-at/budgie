import { Stack } from 'expo-router';

import { ScreenLayout } from '../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../@generic/constant/default-stack-options.constant';

export default function OnboardingLayout() {
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
