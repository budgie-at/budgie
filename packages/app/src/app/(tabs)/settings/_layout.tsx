import { Stack } from 'expo-router/js-stack';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { useLockstepStackOptions } from '../../../@generic/hook/use-lockstep-stack-options.hook';

export default function SettingsLayout() {
    const screenOptions = useLockstepStackOptions();

    return <Stack screenOptions={screenOptions} screenLayout={ScreenLayout} />;
}
