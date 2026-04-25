import { disableLogging as disableBankSyncLogging } from '@budgie/bank-sync';
import { disableLogging } from '@budgie/logger';
import Constants from 'expo-constants';

import { RootLayoutContent } from './root-layout-content';

if (Constants.expoConfig?.extra?.loggingEnabled !== true) {
    disableLogging();
    disableBankSyncLogging();
}

export default function RootLayout() {
    return <RootLayoutContent />;
}
