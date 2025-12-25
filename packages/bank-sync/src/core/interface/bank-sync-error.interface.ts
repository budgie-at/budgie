import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';

export interface BankSyncErrorInterface {
    readonly code: BankSyncErrorCodeEnum;
    readonly message: string;
    readonly provider: BankProviderEnum;
    readonly originalError?: unknown;
}
