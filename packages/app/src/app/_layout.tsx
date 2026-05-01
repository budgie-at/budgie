import { disableLogging as disableBankSyncLogging } from '@budgie/bank-sync';
import { disableLogging } from '@budgie/logger';
import Constants from 'expo-constants';

import { RootLayoutContent } from './root-layout-content';

const loggingEnabledKey = 'loggingEnabled';

if (Constants.expoConfig?.extra?.[loggingEnabledKey] !== true) {
    disableLogging();
    disableBankSyncLogging();
}

export default function RootLayout() {
    return <RootLayoutContent />;
}
