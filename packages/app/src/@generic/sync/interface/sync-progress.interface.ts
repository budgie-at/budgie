import type { SyncStatusEnum } from '../enum/sync-status.enum';
import type { SyncStepEnum } from '../enum/sync-step.enum';

export interface SyncProgressInterface {
    readonly status: SyncStatusEnum;
    readonly step: SyncStepEnum;
    readonly currentAccount: number;
    readonly totalAccounts: number;
    readonly currentBatch: number;
    readonly error?: string;
}
