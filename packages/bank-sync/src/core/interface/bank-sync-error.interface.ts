import type { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import type { SyncProviderEnum } from '../enum/sync-provider.enum';

export interface BankSyncErrorInterface {
    readonly code: BankSyncErrorCodeEnum;
    readonly message: string;
    readonly provider: SyncProviderEnum;
    readonly originalError?: unknown;
}
