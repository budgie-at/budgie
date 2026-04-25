import { setLoggingEnabledProvider as setBankSyncLoggingEnabledProvider } from '@budgie/bank-sync';
import { setLoggingEnabledProvider } from '@budgie/contracts';

import { isLoggingEnabled } from '../@generic/utils/is-logging-enabled.util';

import { RootLayoutContent } from './root-layout-content';

setLoggingEnabledProvider(isLoggingEnabled);
setBankSyncLoggingEnabledProvider(isLoggingEnabled);

export default function RootLayout() {
    return <RootLayoutContent />;
}
