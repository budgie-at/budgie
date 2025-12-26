import { SyncStatusEnum } from '../enum/sync-status.enum';
import { SyncStepEnum } from '../enum/sync-step.enum';

export interface SyncProgressInterface {
    readonly status: SyncStatusEnum;
    readonly step: SyncStepEnum;
    readonly currentAccount: number;
    readonly totalAccounts: number;
    readonly totalTransactions: number;
    readonly currentBatch: number;
    readonly error?: string;
}

export const emptySyncProgress: SyncProgressInterface = {
    status: SyncStatusEnum.IDLE,
    step: SyncStepEnum.IDLE,
    currentAccount: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    currentBatch: 0
};
