import { Stack } from 'expo-router';

import { ScreenLayout } from '../../../@generic/components/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../@generic/constant/default-stack-options.constant';

export default function HomeLayout() {
    return (
        <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
            <Stack.Screen name="index" />
            <Stack.Screen name="account/[id]/details" />
            <Stack.Screen name="account/[id]/update" />
        </Stack>
    );
}
