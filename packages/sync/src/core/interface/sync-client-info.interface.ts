import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface SyncClientInfoInterface {
    readonly id: string;
    readonly name: string;
    readonly provider: SyncProviderEnum;
    readonly webHookUrl?: string;
    readonly permissions?: string;
}
