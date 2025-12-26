import { BankProviderEnum } from '@budgie/bank-sync';

import { SyncProgressInterface } from './sync-progress.interface';

export interface BankSyncStateInterface {
    readonly provider: BankProviderEnum;
    readonly progress: SyncProgressInterface;
    readonly lastSyncAt: string | null;
    readonly lastError: string | null;
}
