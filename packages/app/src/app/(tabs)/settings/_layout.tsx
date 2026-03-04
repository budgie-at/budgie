import { Stack } from 'expo-router';

import { ScreenLayout } from '../../../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../../../@generic/constant/default-stack-options.constant';

export default function SettingsLayout() {
    // eslint-disable-next-line no-console
    console.log('[E2E_DEBUG] SettingsLayout render');
    
return <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout} />;
}
