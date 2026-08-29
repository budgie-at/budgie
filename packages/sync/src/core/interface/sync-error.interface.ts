import type { SyncErrorCodeEnum } from '../enum/sync-error-code.enum';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface SyncErrorInterface {
    readonly code: SyncErrorCodeEnum;
    readonly message: string;
    readonly provider: SyncProviderEnum;
    readonly originalError?: unknown;
}
