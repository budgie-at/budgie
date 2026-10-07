import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class BackgroundSyncNativeModule extends NativeModule {
    update(title: string, subtitle: string, completed: number, total: number): Promise<void>;
    stop(): Promise<void>;
}

export const BackgroundSyncModule = requireOptionalNativeModule<BackgroundSyncNativeModule>('BackgroundSync');
