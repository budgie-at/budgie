import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { BackgroundSyncEventsType } from './src/background-sync-events.type';

declare class BackgroundSyncNativeModule extends NativeModule<BackgroundSyncEventsType> {
    update(title: string, subtitle: string, completed: number, total: number, forceRestart: boolean): Promise<boolean>;
    stop(): Promise<void>;
    isActive(): Promise<boolean>;
}

export const BackgroundSyncModule = requireOptionalNativeModule<BackgroundSyncNativeModule>('BackgroundSync');
