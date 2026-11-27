import { NativeModule, requireOptionalNativeModule } from 'expo';
import { AppRegistry, Platform } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import type { BackgroundSyncEventsType } from './src/background-sync-events.type';

const KEEP_ALIVE_HEADLESS_TASK = 'budgie-background-sync-keep-alive';

if (Platform.OS === 'android') {
    AppRegistry.registerHeadlessTask(KEEP_ALIVE_HEADLESS_TASK, () => () => new Promise<void>(emptyFn));
}

declare class BackgroundSyncNativeModule extends NativeModule<BackgroundSyncEventsType> {
    update(title: string, subtitle: string, completed: number, total: number, forceRestart: boolean): Promise<boolean>;
    stop(): Promise<void>;
    acquireTimerKeepAlive(): Promise<void>;
    releaseTimerKeepAlive(): Promise<void>;
}

export const BackgroundSyncModule = requireOptionalNativeModule<BackgroundSyncNativeModule>('BackgroundSync');
