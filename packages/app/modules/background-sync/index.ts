import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { BackgroundSyncEventsType } from './src/background-sync-events.type';

declare class BackgroundSyncNativeModule extends NativeModule<BackgroundSyncEventsType> {
    begin(title: string, subtitle: string): Promise<boolean>;
    setProgress(completed: number, total: number): Promise<void>;
    end(success: boolean): Promise<void>;
}

export const BackgroundSyncModule = requireOptionalNativeModule<BackgroundSyncNativeModule>('BackgroundSync');
