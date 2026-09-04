import { disableLogging } from '@budgie/logger';
import Constants from 'expo-constants';

import { RootLayoutContent } from './root-layout-content';

const loggingEnabledKey = 'loggingEnabled';
const isLoggingEnabled = __DEV__ || Constants.expoConfig?.extra?.[loggingEnabledKey] === true;

if (!isLoggingEnabled) {
    disableLogging();
    void import('@budgie/sync').then(bankSyncModule => void bankSyncModule.disableLogging());
}

const unstableSettings = {
    anchor: '(tabs)'
};

export { unstableSettings as 'unstable_settings' };

export default function RootLayout() {
    return <RootLayoutContent />;
}
